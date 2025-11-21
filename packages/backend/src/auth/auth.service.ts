import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserDocument } from '../schemas/user.schema.js';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async login(user: UserDocument) {
    const payload = {
      sub: user._id.toString(),
      email: user.email,
      googleId: user.googleId,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user._id.toString(),
        email: user.email,
        displayName: user.displayName,
        picture: user.picture,
      },
    };
  }

  async validateUser(_userId: string): Promise<UserDocument | null> {
    // This would typically query the database
    // For now, we'll rely on the JWT strategy to handle validation
    return null;
  }
}
