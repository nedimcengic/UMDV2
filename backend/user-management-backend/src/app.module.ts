import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KeycloakModule } from './keycloak/keycloak.module';
import { AtlassianScimModule } from './atlassian/atlassianScim.module';
import { CertifyModule } from './certify/CertifyService.module';
import { GoogleWorkspaceModule } from './GoogleWorkspace/google-workspace.module';
import { KeycloakGroup } from './keycloak/dto/keycloak-group.entity';
import { KeycloakUser } from './keycloak/dto/keycloak-user.entity';
import { AtlassianUser } from './atlassian/entities/atlassian-user.entity';
import { AtlassianGroup } from './atlassian/entities/atlassian-group.entity';
import { GoogleWorkspaceToken } from './GoogleWorkspace/dto/google-workspace-token.entity'; // Add this import

@Module({
  imports: [
    // Load environment variables globally
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../.env',
    }),

    // Database configuration using TypeORM
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        entities: [
          KeycloakUser,
          KeycloakGroup,
          AtlassianUser,
          AtlassianGroup,
          GoogleWorkspaceToken, // Add Google Workspace token entity
        ],
        synchronize: true, // Enable schema sync in development only
      }),
    }),

    // Import individual modules
    KeycloakModule,
    AtlassianScimModule,
    CertifyModule,
    GoogleWorkspaceModule, // Include Google Workspace module
  ],
})
export class AppModule {}
