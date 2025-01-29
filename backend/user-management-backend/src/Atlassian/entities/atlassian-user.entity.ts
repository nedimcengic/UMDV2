import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { AtlassianGroup } from './atlassian-group.entity';

@Entity()
export class AtlassianUser {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  atlassianId: string;

  // Add this relationship
  @ManyToOne(() => AtlassianGroup, (group) => group.atlassianUsers, { onDelete: 'CASCADE' })
  group: AtlassianGroup; // This must match the "atlassianUsers" in AtlassianGroup
}
