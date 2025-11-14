import { Controller, Get, Req, Res, UseGuards, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { GoogleAuthGuard } from './google-auth.guard';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthService } from './auth.service';
import { UserDocument } from '../schemas/user.schema';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private authService: AuthService) {}

  @Get('google')
  @ApiOperation({ summary: 'Initiate Google OAuth login' })
  @UseGuards(GoogleAuthGuard)
  async googleAuth() {
    // Guard redirects to Google
  }

  @Get('google/callback')
  @ApiOperation({ summary: 'Google OAuth callback' })
  @UseGuards(GoogleAuthGuard)
  async googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    try {
      const user = req.user as UserDocument;
      const loginResult = await this.authService.login(user);
      
      this.logger.log(`User logged in: ${user.email}`);
      
      // Redirect to frontend with token
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:80';
      res.redirect(`${frontendUrl}/auth/callback?token=${loginResult.access_token}`);
    } catch (error) {
      this.logger.error('Google auth callback error', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:80';
      res.redirect(`${frontendUrl}/auth/error`);
    }
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  @UseGuards(JwtAuthGuard)
  getProfile(@Req() req: Request) {
    const user = req.user as UserDocument;
    return {
      id: user._id.toString(),
      email: user.email,
      displayName: user.displayName,
      picture: user.picture,
    };
  }

  @Get('logout')
  @ApiOperation({ summary: 'Logout (client should clear token)' })
  logout() {
    return { message: 'Logged out successfully' };
  }
}
