import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { KeycloakService } from '../keycloak/keycloak.service';
import { AtlassianGroup } from './entities/atlassian-group.entity';
import { AtlassianUser } from './entities/atlassian-user.entity';

@Injectable()
export class AtlassianScimService {
  private readonly scimBaseUrl: string = process.env.ATLASSIAN_SCIM_BASE_URL;
  private readonly scimToken: string = process.env.ATLASSIAN_SCIM_API_TOKEN;

  private atlassianGroupRepository = this.dataSource.getRepository(AtlassianGroup);
  private atlassianUserRepository = this.dataSource.getRepository(AtlassianUser);

  constructor(
    private readonly httpService: HttpService,
    private readonly keycloakService: KeycloakService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  private getAuthHeaders() {
    return {
      Authorization: `Bearer ${this.scimToken}`,
      'Content-Type': 'application/json',
    };
  }

  async syncKeycloakGroupToAtlassian(
    keycloakGroupId: string,
    groupName: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`Starting sync for Keycloak group ID: ${keycloakGroupId} with Atlassian group: "${groupName}"`);
  
      // Sync users and groups to database before processing
      console.log('Syncing Atlassian Users to the database...');
      await this.syncAllAtlassianUsersToDatabase();
      console.log('Syncing Atlassian Groups to the database...');
      await this.syncAllAtlassianGroupsToDatabase();
  
      // Fetch Keycloak users
      const keycloakUsers = await this.keycloakService.getUsersInGroup(keycloakGroupId);
      const keycloakEmails = new Set(
        keycloakUsers
          .filter(user => user.email) // Ensure valid email
          .map(user => user.email.toLowerCase())
      );
      console.log(`Keycloak Group Members: ${keycloakEmails.size > 0 ? [...keycloakEmails].join(', ') : 'None'}`);
  
      // Get or create the Atlassian group
      const atlassianGroupId = await this.getOrCreateGroup(groupName);
      const atlassianUsers = await this.fetchUsersInAtlassianGroup(atlassianGroupId);
  
      const atlassianEmails = new Map<string, string>();
      atlassianUsers.forEach(user => {
        if (user.userName && user.id) {
          atlassianEmails.set(user.userName.toLowerCase(), user.id);
        }
      });
      console.log(`Atlassian Group Members: ${atlassianEmails.size > 0 ? [...atlassianEmails.keys()].join(', ') : 'None'}`);
  
      // Remove all users from Atlassian if Keycloak group is empty
      if (keycloakEmails.size === 0) {
        console.log(`Keycloak group "${groupName}" is empty. Removing all users from Atlassian group.`);
        for (const [email, userId] of atlassianEmails) {
          try {
            await this.removeUserFromGroupAtlassian(userId, atlassianGroupId, email);
            console.log(`Removed user "${email}" from Atlassian group "${groupName}"`);
          } catch (error) {
            console.error(`Failed to remove user "${email}" from Atlassian group "${groupName}":`, error.message);
          }
        }
        console.log(`All users removed from Atlassian group "${groupName}".`);
      } else {
        // Sync users: Add missing users and remove extra users
        for (const email of keycloakEmails) {
          if (!atlassianEmails.has(email)) {
            try {
              let userId = await this.getAtlassianUserIdByUsername(email);
              if (!userId) {
                console.log(`User "${email}" not found in Atlassian. Creating user.`);
                userId = await this.syncUserToAtlassian({
                  userName: email,
                  name: { givenName: 'Unknown', familyName: 'Unknown' },
                  emails: [{ value: email, primary: true }],
                });
              }
              await this.addUserToGroupAtlassian(userId, groupName);
              console.log(`Added user "${email}" to Atlassian group "${groupName}"`);
            } catch (error) {
              console.error(`Failed to add user "${email}" to Atlassian group "${groupName}":`, error.message);
            }
          }
        }
  
        for (const [email, userId] of atlassianEmails) {
          if (!keycloakEmails.has(email)) {
            try {
              await this.removeUserFromGroupAtlassian(userId, atlassianGroupId, email);
              console.log(`Removed user "${email}" from Atlassian group "${groupName}"`);
            } catch (error) {
              console.error(`Failed to remove user "${email}" from Atlassian group "${groupName}":`, error.message);
            }
          }
        }
      }
  
      console.log(`Sync for Keycloak group "${groupName}" completed successfully`);
      return { success: true, message: 'Users synced successfully' };
    } catch (error) {
      console.error(`Failed to sync Keycloak group "${groupName}":`, error.message);
      return { success: false, message: 'Sync failed' };
    }
  }
  

  private async getOrCreateGroup(groupName: string): Promise<string> {
    let groupId = await this.getGroupFromDatabase(groupName);
    if (!groupId) {
      console.log(`Group "${groupName}" not found in the database. Querying Atlassian API.`);
      groupId = await this.getGroupIdByName(groupName);
    }
    if (!groupId) {
      console.log(`Group "${groupName}" not found in Atlassian. Creating it.`);
      groupId = await this.createGroupInAtlassian(groupName);
      await this.saveGroupToDatabase(groupId, groupName);
    }
    return groupId;
  }

  private async getGroupFromDatabase(groupName: string): Promise<string | null> {
    try {
      const group = await this.atlassianGroupRepository.findOne({
        where: { name: groupName },
      });
      if (group) {
        console.log(`Group "${groupName}" found in database with ID: ${group.atlassianId}`);
      }
      return group ? group.atlassianId : null;
    } catch (error) {
      console.error(`Failed to fetch group "${groupName}" from database:`, error.message);
      return null;
    }
  }

  private async saveGroupToDatabase(groupId: string, groupName: string): Promise<void> {
    try {
      await this.atlassianGroupRepository.upsert(
        {
          atlassianId: groupId,
          name: groupName,
        },
        ['atlassianId'],
      );
      console.log(`Group "${groupName}" (ID: ${groupId}) saved to the database.`);
    } catch (error) {
      console.error(`Failed to save group "${groupName}" to the database:`, error.message);
    }
  }

  private async getGroupIdByName(groupName: string): Promise<string | null> {
    const url = `${this.scimBaseUrl}/Groups?filter=displayName eq "${groupName}"`;
    try {
      const response = await lastValueFrom(this.httpService.get(url, { headers: this.getAuthHeaders() }));
      return response.data.Resources?.[0]?.id || null;
    } catch (error) {
      console.error(`Failed to fetch group "${groupName}":`, error.response?.data || error.message);
      return null;
    }
  }

  private async createGroupInAtlassian(groupName: string): Promise<string> {
    const payload = {
      displayName: groupName,
      schemas: ['urn:ietf:params:scim:schemas:core:2.0:Group'],
    };
    try {
      const response = await lastValueFrom(
        this.httpService.post(`${this.scimBaseUrl}/Groups`, payload, { headers: this.getAuthHeaders() }),
      );
      console.log(`Group "${groupName}" created successfully`);
      return response.data.id;
    } catch (error) {
      console.error(`Failed to create group "${groupName}":`, error.response?.data || error.message);
      throw error;
    }
  }

  private async fetchUsersInAtlassianGroup(groupId: string): Promise<any[]> {
    const url = `${this.scimBaseUrl}/Groups/${groupId}`;
    try {
      const response = await lastValueFrom(this.httpService.get(url, { headers: this.getAuthHeaders() }));
  
      if (!response.data.members || response.data.members.length === 0) {
        console.warn(`Atlassian group "${groupId}" has no members.`);
        return [];
      }
  
      console.log(`Fetched ${response.data.members.length} members from Atlassian group "${groupId}"`);
      return response.data.members.map((member: any) => ({
        id: member.value,
        userName: member.display,
      }));
    } catch (error) {
      console.error(`Failed to fetch users in Atlassian group "${groupId}":`, error.response?.data || error.message);
      return [];
    }
  }
  

  private async syncUserToAtlassian(userData: any): Promise<string> {
    let userId = await this.getUserFromDatabase(userData.userName);
    if (!userId) {
      console.log(`User "${userData.userName}" not found in database. Querying/creating via Atlassian API.`);
      try {
        const response = await lastValueFrom(
          this.httpService.post(`${this.scimBaseUrl}/Users`, userData, { headers: this.getAuthHeaders() }),
        );
        userId = response.data.id;
        await this.saveUserToDatabase(userData.userName, userId);
      } catch (error) {
        if (error.response?.status === 409) {
          console.log(`User "${userData.userName}" already exists. Fetching ID.`);
          userId = await this.getAtlassianUserIdByUsername(userData.userName);
        } else {
          throw error;
        }
      }
    }
    return userId;
  }

  private async getUserFromDatabase(email: string): Promise<string | null> {
    try {
      const user = await this.atlassianUserRepository.findOne({
        where: { email: email.toLowerCase() },
      });
      if (user) {
        console.log(`User "${email}" found in database with ID: ${user.atlassianId}`);
      }
      return user ? user.atlassianId : null;
    } catch (error) {
      console.error(`Failed to fetch user "${email}" from database:`, error.message);
      return null;
    }
  }

  private async saveUserToDatabase(email: string, userId: string): Promise<void> {
    try {
      await this.atlassianUserRepository.upsert(
        {
          email: email.toLowerCase(),
          username: email.toLowerCase(),
          atlassianId: userId,
        },
        ['email'],
      );
      console.log(`User "${email}" (ID: ${userId}) saved to the database.`);
    } catch (error) {
      console.error(`Failed to save user "${email}" to the database:`, error.message);
      throw error;
    }
  }

  private async getAtlassianUserIdByUsername(username: string): Promise<string | null> {
    const url = `${this.scimBaseUrl}/Users?filter=userName eq "${username}"`;
    try {
      const response = await lastValueFrom(this.httpService.get(url, { headers: this.getAuthHeaders() }));
      return response.data.Resources?.[0]?.id || null;
    } catch (error) {
      console.error(`Failed to fetch user ID for "${username}":`, error.response?.data || error.message);
      return null;
    }
  }

  private async addUserToGroupAtlassian(userId: string, groupName: string): Promise<void> {
    const groupId = await this.getOrCreateGroup(groupName);
    const url = `${this.scimBaseUrl}/Groups/${groupId}`;
    const payload = {
      Operations: [{ op: 'add', path: 'members', value: [{ value: userId }] }],
    };

    try {
      console.log(`Sending PATCH request to add user. Payload:`, payload);
      const response = await lastValueFrom(this.httpService.patch(url, payload, { headers: this.getAuthHeaders() }));
      console.log(`Added user ${userId} to group "${groupName}"`);
    } catch (error) {
      console.error(`Failed to add user ${userId}:`, error.response?.data || error.message);
      throw error;
    }
  }

  private async removeUserFromGroupAtlassian(userId: string, groupId: string, email: string): Promise<void> {
    const url = `${this.scimBaseUrl}/Groups/${groupId}`;
    const payload = { Operations: [{ op: 'remove', path: 'members', value: [{ value: userId }] }] };

    try {
      await lastValueFrom(this.httpService.patch(url, payload, { headers: this.getAuthHeaders() }));
      console.log(`Removed user "${email}" from group "${groupId}"`);
    } catch (error) {
      console.error(`Failed to remove user "${email}":`, error.response?.data || error.message);
      throw error;
    }
  }

  async syncAllAtlassianGroupsToDatabase(): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`Starting full sync of all Atlassian groups to the database...`);

      const url = `${this.scimBaseUrl}/Groups`;
      let nextPageUrl: string | null = url;
      let totalGroupsFetched = 0;

      while (nextPageUrl) {
        console.log(`Fetching groups from: ${nextPageUrl}`);
        const response = await lastValueFrom(this.httpService.get(nextPageUrl, { headers: this.getAuthHeaders() }));

        const groups = response.data.Resources || [];
        totalGroupsFetched += groups.length;

        for (const group of groups) {
          try {
            await this.atlassianGroupRepository.upsert(
              {
                atlassianId: group.id,
                name: group.displayName,
              
              },
              ['atlassianId'],
            );
            console.log(`Upserted group: ${group.displayName} (ID: ${group.id})`);
          } catch (error) {
            console.error(`Failed to save group "${group.displayName}":`, error.message);
          }
        }

        nextPageUrl = response.data['next'] || null;
      }

      console.log(`Successfully synced ${totalGroupsFetched} groups to the database.`);
      return { success: true, message: `${totalGroupsFetched} groups synced to the database successfully.` };
    } catch (error) {
      console.error(`Failed to sync all Atlassian groups to the database:`, error.response?.data || error.message);
      return { success: false, message: 'Failed to sync groups to the database.' };
    }
  }

// Sync all Atlassian users to the database
async syncAllAtlassianUsersToDatabase(): Promise<{ success: boolean; message: string }> {
  try {
    console.log(`Starting full sync of all Atlassian users to the database...`);

    const url = `${this.scimBaseUrl}/Users`;
    let nextPageUrl: string | null = url; // Initial API endpoint
    let totalUsersFetched = 0;

    while (nextPageUrl) {
      console.log(`Fetching users from: ${nextPageUrl}`);
      const response = await lastValueFrom(this.httpService.get(nextPageUrl, { headers: this.getAuthHeaders() }));

      const users = response.data.Resources || [];
      totalUsersFetched += users.length;

      for (const user of users) {
        if (user.userName && user.id) { // Ensure valid username and ID
          try {
            await this.atlassianUserRepository.save({
              email: user.userName.toLowerCase(),
              username: user.userName.toLowerCase(),
              atlassianId: user.id,
            });
            console.log(`Saved user: ${user.userName} (ID: ${user.id})`);
          } catch (error) {
            console.error(`Failed to save user ${user.userName}:`, error.message);
          }
        } else {
          console.warn(`Skipped user with missing username or ID:`, user);
        }
      }

      nextPageUrl = response.data['next'] || null; // Update for next page if available
    }

    console.log(`Successfully synced ${totalUsersFetched} users to the database.`);
    return { success: true, message: `${totalUsersFetched} users synced to the database successfully.` };
  } catch (error) {
    console.error(`Failed to sync all Atlassian users to the database:`, error.response?.data || error.message);
    return { success: false, message: 'Failed to sync users to the database.' };
  }
}

}
