import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { AtlassianUser } from './atlassian-user.entity';

@Entity()
export class AtlassianGroup {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ unique: true, nullable: true })
  atlassianId: string;
 
  // Add this relationship
  @OneToMany(() => AtlassianUser, (user) => user.group, { cascade: true })
  atlassianUsers: AtlassianUser[]; // This field must exist
}
