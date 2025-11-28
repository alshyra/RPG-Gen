import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './user.schema.js';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {
    super({
      clientID: process.env.GOOGLE_OAUTH_CLIENT_ID,
      clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
      callbackURL:
        process.env.GOOGLE_OAUTH_CALLBACK_URL || 'http://localhost/api/auth/google/callback',
      scope: [
        'email',
        'profile',
      ],
    });

    this.logger.log('GoogleStrategy initialized with:', {
      clientID: process.env.GOOGLE_OAUTH_CLIENT_ID?.substring(0, 10) + '***',
      callbackURL: process.env.GOOGLE_OAUTH_CALLBACK_URL,
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<void> {
    this.logger.log('Google profile received:', {
      id: profile.id,
      email: profile.emails?.[0]?.value,
      displayName: profile.displayName,
    });

    const user = await this.findOrCreateUser(profile);
    done(null, user);
  }

  private async findOrCreateUser(profile: Profile): Promise<UserDocument> {
    const { id, name, emails, photos } = profile;
    let user = await this.userModel.findOne({ googleId: id });

    if (!user) {
      this.logger.log('Creating new user from Google profile');
      user = await this.userModel.create({
        googleId: id,
        email: emails?.[0]?.value || '',
        displayName: profile.displayName,
        firstName: name?.givenName,
        lastName: name?.familyName,
        picture: photos?.[0]?.value,
        lastLogin: new Date(),
      });
      this.logger.log('User created:', { id: user._id, email: user.email });
    } else {
      this.logger.log('User already exists, updating last login');
      user.lastLogin = new Date();
      await user.save();
    }

    return user;
  }
}
