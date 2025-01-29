import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { AtlassianScimService } from './atlassianScim.service';

@Controller('atlassian-scim')
export class AtlassianScimController {
  constructor(private readonly atlassianScimService: AtlassianScimService) {}
 
  @Post('sync-atlassian-users')
  async syncAllUsers(): Promise<any> {
    return this.atlassianScimService.syncAllAtlassianUsersToDatabase();
  }
  @Post('sync')
  async syncGroup(@Body() { keycloakGroupId, groupName }: { keycloakGroupId: string; groupName: string }) {
    if (!keycloakGroupId || !groupName) {
      throw new BadRequestException('Both keycloakGroupId and groupName are required.');
    }

    try {
      await this.atlassianScimService.syncKeycloakGroupToAtlassian(keycloakGroupId, groupName);
      return { success: true, message: 'Group synced successfully' };
    } catch (error) {
      console.error('Error syncing group:', error.message);
      throw new BadRequestException('Failed to sync group to Atlassian');
    }
  }
}
