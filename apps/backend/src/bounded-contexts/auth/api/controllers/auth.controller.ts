import { Controller, Get, Logger, Req, Res, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import type { Response } from "express";
import type { RPGRequest } from "../../../../global.types.js";
import { AuthProfileDto } from "../dto/AuthProfileDto.js";
import { AuthAppService } from "../../application/services/AuthAppService.js";
import { AuthUser } from "../../domain/entities/AuthUser.js";
import { GoogleAuthGuard } from "../../infrastructure/auth/guards/GoogleAuthGuard.js";
import { JwtAuthGuard } from "../../infrastructure/auth/guards/JwtAuthGuard.js";
import { getConfig } from "../../../../config.js";

/**
 * AuthController
 *
 * API layer for authentication endpoints.
 * Delegates all business logic to AuthAppService.
 * - Google OAuth flow
 * - Profile retrieval
 * - Logout
 */
@ApiTags("auth")
@Controller("auth")
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private authAppService: AuthAppService) {}

  @Get("google")
  @ApiOperation({ summary: "Initiate Google OAuth login" })
  @UseGuards(GoogleAuthGuard)
  async googleAuth() {
    // Guard redirects to Google
  }

  @Get("google/callback")
  @ApiOperation({ summary: "Google OAuth callback" })
  @UseGuards(GoogleAuthGuard)
  async googleAuthRedirect(@Req() req: RPGRequest, @Res() res: Response) {
    try {
      const user = req.user as AuthUser;
      if (!user) {
        throw new Error("No user from Google strategy");
      }

      // Generate JWT via app service
      const { accessToken } = await this.authAppService.loginWithGoogle({
        googleId: user.googleId,
        email: user.email,
        displayName: user.displayName,
        firstName: user.firstName,
        lastName: user.lastName,
        picture: user.picture,
      });

      this.logger.log(`User logged in: ${user.email}`);

      // Redirect to frontend with token
      const frontendUrl = getConfig().frontend.url;
      res.redirect(`${frontendUrl}/auth/callback?token=${accessToken}`);
    } catch (error) {
      this.logger.error("Google auth callback error", error);
      const frontendUrl = getConfig().frontend.url;
      res.redirect(`${frontendUrl}/auth/error`);
    }
  }

  @Get("profile")
  @ApiOperation({ summary: "Get current user profile" })
  @UseGuards(JwtAuthGuard)
  @ApiResponse({
    status: 200,
    description: "Current user profile",
    type: AuthProfileDto,
  })
  getProfile(@Req() req: RPGRequest) {
    const user = req.user as AuthUser;
    return user.toProfile();
  }

  @Get("logout")
  @ApiOperation({ summary: "Logout (client should clear token)" })
  async logout(@Req() req: RPGRequest) {
    const user = req.user as AuthUser;
    await this.authAppService.logout(user.id);
    return { message: "Logged out successfully" };
  }
}
