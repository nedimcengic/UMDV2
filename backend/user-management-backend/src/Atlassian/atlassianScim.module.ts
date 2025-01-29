import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AtlassianScimService } from './atlassianScim.service';
import { AtlassianScimController } from './atlassianScim.controller';
import { KeycloakModule } from '../keycloak/keycloak.module';
import { AtlassianUser } from './entities/atlassian-user.entity';
import { AtlassianGroup } from './entities/atlassian-group.entity';

@Module({
  imports: [
    HttpModule, // For making HTTP requests to Atlassian SCIM API
    KeycloakModule, // Import KeycloakModule for Keycloak services
    TypeOrmModule.forFeature([AtlassianUser, AtlassianGroup]), // Database entities for Atlassian users and groups
  ],
  providers: [AtlassianScimService], // Atlassian service to handle SCIM sync
  controllers: [AtlassianScimController], // Atlassian controller to expose REST endpoints
  exports: [AtlassianScimService], // Export service if used in other modules
})
export class AtlassianScimModule {}
