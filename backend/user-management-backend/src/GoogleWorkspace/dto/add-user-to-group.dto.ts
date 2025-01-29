import { IsEmail, IsNotEmpty } from 'class-validator';

export class AddUserToGroupDto {
  @IsEmail()
  userEmail: string;

  @IsEmail()
  groupEmail: string;
}
