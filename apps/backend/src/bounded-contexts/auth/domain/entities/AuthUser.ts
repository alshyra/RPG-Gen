/**
 * AuthUser Entity - Domain aggregate root
 *
 * Represents an authenticated user with identity and profile information.
 * All business logic for user state/validation stays here.
 *
 * @immutable Use updateLastLogin() or similar methods for state changes
 */
export interface AuthUserProps {
  id: string; // MongoDB ObjectId as string
  googleId: string;
  email: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  picture?: string;
  lastLogin: Date;
}

export class AuthUser {
  private readonly _id: string;
  private readonly _googleId: string;
  private readonly _email: string;
  private readonly _displayName?: string;
  private readonly _firstName?: string;
  private readonly _lastName?: string;
  private readonly _picture?: string;
  private readonly _lastLogin: Date;

  constructor(props: AuthUserProps) {
    if (!props.id) throw new Error('id required');
    if (!props.googleId) throw new Error('googleId required');
    if (!props.email) throw new Error('email required');

    this._id = props.id;
    this._googleId = props.googleId;
    this._email = props.email;
    this._displayName = props.displayName;
    this._firstName = props.firstName;
    this._lastName = props.lastName;
    this._picture = props.picture;
    this._lastLogin = props.lastLogin;
  }

  // Getters
  get id(): string { return this._id; }
  get googleId(): string { return this._googleId; }
  get email(): string { return this._email; }
  get displayName(): string | undefined { return this._displayName; }
  get firstName(): string | undefined { return this._firstName; }
  get lastName(): string | undefined { return this._lastName; }
  get picture(): string | undefined { return this._picture; }
  get lastLogin(): Date { return this._lastLogin; }

  /**
   * Create new instance with updated lastLogin
   * (immutable pattern — returns new entity)
   */
  withUpdatedLastLogin(date: Date): AuthUser {
    return new AuthUser({
      id: this._id,
      googleId: this._googleId,
      email: this._email,
      displayName: this._displayName,
      firstName: this._firstName,
      lastName: this._lastName,
      picture: this._picture,
      lastLogin: date,
    });
  }

  /**
   * Convert to JWT payload
   */
  toJwtPayload() {
    return {
      sub: this._id,
      email: this._email,
      googleId: this._googleId,
    };
  }

  /**
   * Convert to profile DTO (public response)
   */
  toProfile() {
    return {
      id: this._id,
      email: this._email,
      displayName: this._displayName,
      picture: this._picture,
    };
  }
}
