// GENERATED FROM backend/src/schemas - do not edit manually


export interface UserDto {
  googleId: string;
  email: string;
  displayName: string;
  firstName: string;
  lastName: string;
  picture: string;
  lastLogin: Date;
}
export type CreateUserDto = Partial<UserDto>;
export type UpdateUserDto = Partial<CreateUserDto>;
