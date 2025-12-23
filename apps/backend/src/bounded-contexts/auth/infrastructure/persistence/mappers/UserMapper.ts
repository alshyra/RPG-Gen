import { AuthUser } from '../../../domain/entities/AuthUser.js';
import { UserDocument } from '../mongo/schemas/UserDocument.js';

/**
 * Mapper: transforms between Mongoose Document and Domain Entity
 *
 * Isolates persistence details from domain logic.
 * All Document→Entity and Entity→persistence goes through here.
 */
export class UserMapper {
  /**
   * Map Mongoose UserDocument to domain AuthUser entity
   */
  static toDomain(raw: UserDocument): AuthUser {
    if (!raw._id) throw new Error('User document must have _id');

    return new AuthUser({
      id: raw._id.toString(), // Convert ObjectId to string
      googleId: raw.googleId,
      email: raw.email,
      displayName: raw.displayName,
      firstName: raw.firstName,
      lastName: raw.lastName,
      picture: raw.picture,
      lastLogin: raw.lastLogin,
    });
  }

  /**
   * Convert domain AuthUser to persistence-ready object
   * (suitable for .updateOne, .findByIdAndUpdate, etc.)
   */
  static toPersistence(entity: AuthUser) {
    return {
      googleId: entity.googleId,
      email: entity.email,
      displayName: entity.displayName,
      firstName: entity.firstName,
      lastName: entity.lastName,
      picture: entity.picture,
      lastLogin: entity.lastLogin,
    };
  }
}
