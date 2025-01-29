import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { KeycloakUser } from './dto/keycloak-user.entity';
import { KeycloakGroup } from './dto/keycloak-group.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { AddUserToGroupDto } from './dto/add-user-to-group.dto';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class KeycloakService {
  private userRepository;
  private groupRepository;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {
    this.userRepository = this.dataSource.getRepository(KeycloakUser);
    this.groupRepository = this.dataSource.getRepository(KeycloakGroup);
  }

  private cachedToken: string | null = null;
  private tokenExpiration: number | null = null;

  private async getAccessToken(): Promise<string> {
    if (this.cachedToken && this.tokenExpiration && Date.now() < this.tokenExpiration) {
      return this.cachedToken;
    }

    const baseUrl = this.configService.get('KEYCLOAK_BASE_URL');
    const clientId = this.configService.get('KEYCLOAK_CLIENT_ID');
    const clientSecret = this.configService.get('KEYCLOAK_CLIENT_SECRET');
    const realm = this.configService.get('KEYCLOAK_REALM_NAME');
    const tokenEndpoint = `${baseUrl}/realms/${realm}/protocol/openid-connect/token`;

    const payload = new URLSearchParams();
    payload.append('grant_type', 'client_credentials');
    payload.append('client_id', clientId);
    payload.append('client_secret', clientSecret);

    const response = await lastValueFrom(
      this.httpService.post(tokenEndpoint, payload, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }),
    );

    const { access_token, expires_in } = response.data;
    this.cachedToken = access_token;
    this.tokenExpiration = Date.now() + expires_in * 1000; // Convert seconds to ms

    return access_token;
  }

  

  // Fetch groups from Keycloak and save them to the database
  async fetchGroups(): Promise<any[]> {
    const token = await this.getAccessToken();
    const baseUrl = this.configService.get('KEYCLOAK_BASE_URL');
    const realm = this.configService.get('KEYCLOAK_REALM_NAME');
    
    const groupsUrl = `${baseUrl}/admin/realms/${realm}/groups?briefRepresentation=false`;

    try {
      const response = await lastValueFrom(
        this.httpService.get(groupsUrl, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      );

      const groups = response.data;

      // Save groups to database if not already there
      await this.saveGroupsToDb(groups);

      return groups;
    } catch (error) {
      console.error('Error fetching groups:', error.response?.data || error.message);
      throw new Error(`Failed to fetch groups: ${JSON.stringify(error.response?.data)}`);
    }
  }

  // Save groups and their subgroups to the database
  private async saveGroupsToDb(groups: any[]): Promise<void> {
    for (const group of groups) {
      const groupName = group.name || 'Unnamed Group'; // Assign default name
  
      const existingGroup = await this.groupRepository.findOne({ where: { keycloakGroupId: group.id } });
      if (!existingGroup) {
        const newGroup = this.groupRepository.create({
          name: groupName,
          keycloakGroupId: group.id,
        });
        await this.groupRepository.save(newGroup);
      }
  
      if (group.subGroups && group.subGroups.length > 0) {
        await this.saveGroupsToDb(group.subGroups); // Recursively save subgroups
      }
    }
  }
  
  
  // Retrieve groups from the database (for frontend use)
  async getGroupsFromDb(): Promise<KeycloakGroup[]> {
    return this.groupRepository.find();  // Retrieves all groups from the database
  }

  // Create a user in Keycloak
  // src/keycloak/keycloak.service.ts
// src/keycloak/keycloak.service.ts
async createUser(createUserDto: CreateUserDto) {
  const token = await this.getAccessToken();
  const baseUrl = this.configService.get('KEYCLOAK_BASE_URL');
  const realm = this.configService.get('KEYCLOAK_REALM_NAME');
  const url = `${baseUrl}/admin/realms/${realm}/users`;

  const userPayload = {
    username: createUserDto.username,
    email: createUserDto.email,
    firstName: createUserDto.firstName,
    lastName: createUserDto.lastName,
    enabled: true,
  };

  try {
    console.log('Payload sent to Keycloak:', userPayload);

    // Step 1: Create the user in Keycloak
    const response = await lastValueFrom(
      this.httpService.post(url, userPayload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }),
    );

    // Step 2: Extract Keycloak user ID from the response
    const locationHeader = response.headers['location'];
    const keycloakUserId = locationHeader.split('/').pop();

    console.log(`User created in Keycloak with ID: ${keycloakUserId}`);

    // Step 3: Save the user in the local database
    const newUser = this.userRepository.create({
      KeycloakUserid: keycloakUserId,
      username: createUserDto.username,
      email: createUserDto.email,
    });
    await this.userRepository.save(newUser);

    console.log('User saved to local database:', newUser);

    return newUser;
  } catch (error) {
    console.error('Failed to create user in Keycloak:', error.response?.data || error.message);
    const errorMessage = error.response?.data?.errorMessage
      ? `Failed to create user: ${error.response.data.errorMessage}`
      : `Failed to create user due to an unknown error.`;

    throw new Error(errorMessage);
  }
}


  // Add users to a Keycloak group
  async addUsersToGroup(userIds: string[], groupId: string) {
    const token = await this.getAccessToken();
    const baseUrl = this.configService.get('KEYCLOAK_BASE_URL');
    const realm = this.configService.get('KEYCLOAK_REALM_NAME');

    const results = { success: [], failed: [] };

    for (const userId of userIds) {
      // Construct the URL to add a user to a group
      const groupUrl = `${baseUrl}/admin/realms/${realm}/users/${userId}/groups/${groupId}`;
      
      console.log("Attempting to add user to group URL:", groupUrl); // Log the full URL to debug

      try {
        await lastValueFrom(
          this.httpService.put(groupUrl, {}, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        );
        results.success.push(userId);
      } catch (error) {
        results.failed.push(userId);
        console.error(`Failed to add user ${userId} to group ${groupId}:`, error.message); // Log any errors
      }
    }
  }
  // Bulk create users in Keycloak
// src/keycloak/keycloak.service.ts
async bulkCreateUsers(userRows: string[]): Promise<{ success: string[]; failed: string[] }> {
  const token = await this.getAccessToken();
  const baseUrl = this.configService.get('KEYCLOAK_BASE_URL');
  const realm = this.configService.get('KEYCLOAK_REALM_NAME');
  const url = `${baseUrl}/admin/realms/${realm}/users`;

  const results = { success: [], failed: [] };

  for (const row of userRows) {
    // Split input row into parts: email, firstName, lastName
    const [email, firstName, lastName] = row.split(',').map((part) => part.trim());

    // Validate required values
    if (!email || !firstName || !lastName) {
      console.warn(`Invalid input format: "${row}". Skipping.`);
      results.failed.push(row);
      continue;
    }

    const username = email.split('@')[0]; // Extract username from email

    const userPayload = {
      username,
      email,
      firstName,
      lastName,
      enabled: true,
      requiredActions: ['VERIFY_EMAIL', 'CONFIGURE_TOTP'], // Set actions
      attributes: {
        createdBy: 'BulkImport',
      },
    };

    try {
      // Send request to Keycloak to create user
      const response = await lastValueFrom(
        this.httpService.post(url, userPayload, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        }),
      );

      // Extract Keycloak user ID from response
      const locationHeader = response.headers['location'];
      const keycloakUserId = locationHeader.split('/').pop();

      // Save user to the local database
      const newUser = this.userRepository.create({
        KeycloakUserid: keycloakUserId,
        username,
        email,
        firstName,
        lastName,
      });
      await this.userRepository.save(newUser);

      console.log(`User "${email}" created successfully.`);
      results.success.push(row);
    } catch (error) {
      console.error(`Failed to create user "${email}":`, error.response?.data || error.message);
      results.failed.push(row);
    }
  }

  return results;
}


  
  // Get all users in a specified Keycloak group
  // src/keycloak/keycloak.service.ts
  async getUsersInGroup(groupId: string): Promise<any[]> {
    const token = await this.getAccessToken();
    const baseUrl = this.configService.get('KEYCLOAK_BASE_URL');
    const realm = this.configService.get('KEYCLOAK_REALM_NAME');
    const url = `${baseUrl}/admin/realms/${realm}/groups/${groupId}/members`;

    try {
        const response = await lastValueFrom(
            this.httpService.get(url, {
                headers: { Authorization: `Bearer ${token}` },
            }),
        );

        const users = response.data;
        return users.map((user) => ({
            id: user.id,
            username: user.username || `${user.firstName || 'unknown'}.${user.lastName || 'unknown'}`,
            email: user.email || `${user.username || 'unknown'}@domain.com`,
            firstName: user.firstName || 'Unknown',
            lastName: user.lastName || 'Unknown',
        }));
    } catch (error) {
        console.error(`Failed to fetch users in group "${groupId}":`, error.response?.data || error.message);
        throw new Error(`Failed to fetch users from Keycloak: ${JSON.stringify(error.response?.data)}`);
    }
}

  

  

  // Find user in Keycloak by username
  async getUserByUsername(username: string): Promise<any> {
    const token = await this.getAccessToken();
    const baseUrl = this.configService.get('KEYCLOAK_BASE_URL');
    const realm = this.configService.get('KEYCLOAK_REALM_NAME');
    const url = `${baseUrl}/admin/realms/${realm}/users?username=${username}`;

    try {
      const response = await lastValueFrom(
        this.httpService.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      );

      return response.data[0];
    } catch (error) {
      console.error('Error fetching user by username:', error.response?.data || error.message);
      throw new Error(`Failed to fetch user by username: ${JSON.stringify(error.response?.data)}`);
    }
  }
   // Fetch users from Keycloak
   async getUsers(): Promise<any[]> {
    const token = await this.getAccessToken();
    const baseUrl = this.configService.get('KEYCLOAK_BASE_URL');
    const realm = this.configService.get('KEYCLOAK_REALM_NAME');
    const usersUrl = `${baseUrl}/admin/realms/${realm}/users`;

    try {
      const response = await lastValueFrom(
        this.httpService.get(usersUrl, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      );

      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error.response?.data || error.message);
      throw new Error(`Failed to fetch users: ${JSON.stringify(error.response?.data)}`);
    }
  }

  // Search users in Keycloak by search term
  async searchUsers(searchTerm: string): Promise<any[]> {
    const token = await this.getAccessToken();
    const baseUrl = this.configService.get('KEYCLOAK_BASE_URL');
    const realm = this.configService.get('KEYCLOAK_REALM_NAME');
    const url = `${baseUrl}/admin/realms/${realm}/users?search=${searchTerm}`;

    try {
      const response = await lastValueFrom(
        this.httpService.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      );

      return response.data;
    } catch (error) {
      console.error('Error searching users:', error.response?.data || error.message);
      throw new Error(`Failed to search users: ${JSON.stringify(error.response?.data)}`);
    }
  }

  // Remove a user from Keycloak
  async removeUser(userId: string): Promise<void> {
    const token = await this.getAccessToken();
    const baseUrl = this.configService.get('KEYCLOAK_BASE_URL');
    const realm = this.configService.get('KEYCLOAK_REALM_NAME');
    const url = `${baseUrl}/admin/realms/${realm}/users/${userId}`;

    try {
      await lastValueFrom(
        this.httpService.delete(url, {
          headers: { Authorization: `Bearer ${token}` },
        })
      );
      console.log(`User ${userId} removed successfully`);
    } catch (error) {
      console.error(`Failed to remove user ${userId}:`, error.response?.data || error.message);
      throw new Error(`Failed to remove user: ${JSON.stringify(error.response?.data)}`);
    }
  }

  // Remove a user from a group in Keycloak
  async removeUserFromGroup(userIds: string[], groupId: string): Promise<void> {
    const token = await this.getAccessToken();
    const baseUrl = this.configService.get('KEYCLOAK_BASE_URL');
    const realm = this.configService.get('KEYCLOAK_REALM_NAME');
  
    for (const userId of userIds) {
      const url = `${baseUrl}/admin/realms/${realm}/users/${userId}/groups/${groupId}`;
      try {
        await lastValueFrom(
          this.httpService.delete(url, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        );
        console.log(`User ${userId} removed from group ${groupId}`);
      } catch (error) {
        console.error(
          `Failed to remove user ${userId} from group ${groupId}:`,
          error.response?.data || error.message,
        );
      }
    }
  }
  

  // Create a group in Keycloak (with optional parent group)
  async createGroup(groupName: string, parentGroupName?: string): Promise<any> {
    if (!groupName || groupName.trim() === '') {
      throw new Error('Group name cannot be empty.');
    }
  
    const token = await this.getAccessToken();
    const baseUrl = this.configService.get('KEYCLOAK_BASE_URL');
    const realm = this.configService.get('KEYCLOAK_REALM_NAME');
  
    let parentGroupId: string | undefined;
    if (parentGroupName) {
      parentGroupId = await this.getGroupIdByName(parentGroupName);
      if (!parentGroupId) {
        throw new Error(`Parent group with name "${parentGroupName}" not found.`);
      }
    }
  
    const url = parentGroupId
      ? `${baseUrl}/admin/realms/${realm}/groups/${parentGroupId}/children`
      : `${baseUrl}/admin/realms/${realm}/groups`;
  
    try {
      const response = await lastValueFrom(
        this.httpService.post(
          url,
          { name: groupName },
          {
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          },
        ),
      );
      console.log(`Group "${groupName}" created successfully`);
      return response.data;
    } catch (error) {
      console.error(`Failed to create group "${groupName}":`, error.response?.data || error.message);
      throw new Error(`Failed to create group: ${JSON.stringify(error.response?.data)}`);
    }
  }
  

  // Helper method to find a group by name in Keycloak
  async getGroupIdByName(groupName: string): Promise<string | null> {
    const token = await this.getAccessToken();
    const baseUrl = this.configService.get('KEYCLOAK_BASE_URL');
    const realm = this.configService.get('KEYCLOAK_REALM_NAME');
    
    const url = `${baseUrl}/admin/realms/${realm}/groups`;

    try {
      const response = await lastValueFrom(
        this.httpService.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        })
      );

      const groups = response.data;
      const findGroup = (groupList: any[]): any => {
        for (const group of groupList) {
          if (group.name === groupName) return group.id;
          if (group.subGroups?.length) {
            const result = findGroup(group.subGroups);
            if (result) return result;
          }
        }
        return null;
      };

      return findGroup(groups) || null;
    } catch (error) {
      console.error(`Error finding group "${groupName}" by name:`, error.response?.data || error.message);
      return null;
    }
  }
}
