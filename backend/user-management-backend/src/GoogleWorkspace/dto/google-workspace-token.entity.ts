import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class GoogleWorkspaceToken {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  accessToken: string;

  @Column()
  refreshToken: string;

  @Column({ nullable: true })
  expiryDate: number;
}
