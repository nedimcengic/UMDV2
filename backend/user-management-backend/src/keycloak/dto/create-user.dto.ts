export class CreateUserDto {
  username: string; // Required for Keycloak
  email: string;
  firstName: string;
  lastName: string;
}
