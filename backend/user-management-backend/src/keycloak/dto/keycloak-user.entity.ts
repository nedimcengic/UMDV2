import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { KeycloakGroup } from './keycloak-group.entity';

@Entity()
export class KeycloakUser {
  @PrimaryGeneratedColumn('uuid')
  KeycloakUserid: string; // Database primary key

  @Column()
  username: string; // Username of the user

  @Column({ unique: true })
  email: string; // User's email address
  
  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @ManyToOne(() => KeycloakGroup, (group) => group.users, { onDelete: 'CASCADE' }) // Group relationship
  group: KeycloakGroup; // Reference to the group the user belongs to
}

export default KeycloakUser; // Export the class
