import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuthUser } from '../../../domain/entities/AuthUser.js';
import { IUserRepository } from '../../../domain/repositories/IUserRepository.js';
import { User, UserDocument } from './schemas/UserDocument.js';
import { UserMapper } from '../mappers/UserMapper.js';

/**
 * Adapter: MongoUserRepository
 *
 * Implements IUserRepository using MongoDB/Mongoose.
 * Handles all persistence operations and entity mapping.
 */
@Injectable()
export class MongoUserRepository implements IUserRepository {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findById(id: string): Promise<AuthUser | null> {
    const doc = await this.userModel.findById(id).exec();
    return doc ? UserMapper.toDomain(doc) : null;
  }

  async findByEmail(email: string): Promise<AuthUser | null> {
    const doc = await this.userModel.findOne({ email }).exec();
    return doc ? UserMapper.toDomain(doc) : null;
  }

  async findByGoogleId(googleId: string): Promise<AuthUser | null> {
    const doc = await this.userModel.findOne({ googleId }).exec();
    return doc ? UserMapper.toDomain(doc) : null;
  }

  async findOrCreateFromGoogle(googleProfile: {
    googleId: string;
    email: string;
    displayName?: string;
    firstName?: string;
    lastName?: string;
    picture?: string;
  }): Promise<AuthUser> {
    // Try to find existing user by Google ID
    let doc = await this.userModel.findOne({ googleId: googleProfile.googleId }).exec();

    if (doc) {
      // Update lastLogin
      doc.lastLogin = new Date();
      doc = await doc.save();
      return UserMapper.toDomain(doc);
    }

    // Create new user if not found
    const newUser = new this.userModel({
      ...googleProfile,
      lastLogin: new Date(),
    });

    doc = await newUser.save();
    return UserMapper.toDomain(doc);
  }

  async save(user: AuthUser): Promise<AuthUser> {
    const persistence = UserMapper.toPersistence(user);

    const doc = await this.userModel.findByIdAndUpdate(
      user.id,
      persistence,
      { new: true },
    ).exec();

    if (!doc) {
      throw new Error(`User ${user.id} not found during save`);
    }

    return UserMapper.toDomain(doc);
  }

  async delete(id: string): Promise<void> {
    await this.userModel.findByIdAndDelete(id).exec();
  }
}
