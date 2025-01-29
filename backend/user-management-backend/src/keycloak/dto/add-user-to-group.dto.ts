import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class AddUserToGroupDto {
  @IsArray()
  @IsNotEmpty()
  userIds: string[];

  @IsString()
  @IsNotEmpty()
  groupId: string;
}
