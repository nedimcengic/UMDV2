// src/keycloak/keycloak.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { KeycloakService } from './keycloak.service';
import { KeycloakController } from './keycloak.controller';
import { KeycloakGroup } from './dto/keycloak-group.entity';
import { KeycloakUser } from './dto/keycloak-user.entity';

@Module({
  imports: [
    HttpModule, // For making HTTP requests to Keycloak API
    TypeOrmModule.forFeature([KeycloakGroup]),
    TypeOrmModule.forFeature([KeycloakUser, KeycloakGroup]), // Register Group entity with TypeORM for database access
  ],
  controllers: [KeycloakController], // Connect KeycloakController for route handling
  providers: [KeycloakService], // Register KeycloakService as a provider
  exports: [KeycloakService], // Optional: export KeycloakService if it’s used in other modules
})
export class KeycloakModule {}
