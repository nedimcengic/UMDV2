// src/keycloak/keycloak.controller.ts
import { Controller, Post, Body, Get } from '@nestjs/common';
import { KeycloakService } from './keycloak.service';
import { CreateUserDto } from './dto/create-user.dto';
import { AddUserToGroupDto } from './dto/add-user-to-group.dto';

@Controller('keycloak')
export class KeycloakController {
  constructor(private readonly keycloakService: KeycloakService) {}

  @Post('create-user')
  async createUser(@Body() createUserDto: CreateUserDto) {
    return await this.keycloakService.createUser(createUserDto);
  }

  @Post('bulk-create-users')
  async bulkCreateUsers(@Body('emails') emails: string[]) {
    if (!emails || emails.length === 0) {
      throw new Error('No emails provided for bulk creation');
    }

    return await this.keycloakService.bulkCreateUsers(emails);
  }

  @Get('groups')
  async getGroups() {
    return await this.keycloakService.fetchGroups();
  }

  @Get('users')
  async getUsers() {
    return await this.keycloakService.getUsers();
  }

  @Post('create-group')
  async createGroup(@Body() { groupName }: { groupName: string }) {
    console.log(`Creating group with name: ${groupName}`);
    return await this.keycloakService.createGroup(groupName);
  }

  @Post('add-user-to-group')
  async addUsersToGroup(@Body() body: AddUserToGroupDto) {
    console.log('Received addUsersToGroup request:', body);

    const { userIds, groupId } = body;

    return await this.keycloakService.addUsersToGroup(userIds, groupId);
  }

  @Post('remove-user-from-group')
  async removeUsersFromGroup(@Body() body: AddUserToGroupDto) {
    console.log('Received removeUsersFromGroup request:', body);

    const { userIds, groupId } = body;

    return await this.keycloakService.removeUserFromGroup(userIds, groupId);
  }
}
