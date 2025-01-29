import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class GoogleWorkspaceGroupDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  description: string;
}
