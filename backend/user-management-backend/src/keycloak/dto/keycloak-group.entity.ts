import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { KeycloakUser } from './keycloak-user.entity';

@Entity()
export class KeycloakGroup {
  @PrimaryGeneratedColumn('uuid')
  keycloakGroupId: string; // Database primary key

  @Column({ unique: true })
  name: string; // Group name

  @OneToMany(() => KeycloakUser, (user) => user.group) // Relationship to KeycloakUser
  users: KeycloakUser[];
}

export default KeycloakGroup; // Export the class
