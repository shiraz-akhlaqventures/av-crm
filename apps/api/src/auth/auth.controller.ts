import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { CurrentUser } from "./current-user.decorator";
import { LoginDto } from "./dto/login.dto";
import type { TokenPayload } from "@av-crm/shared-types";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /**
   * POST /auth/login
   * Body: { idToken: <Firebase ID token> }
   * Returns: { accessToken, refreshToken, user }
   */
  @Post("login")
  login(@Body() body: LoginDto) {
    return this.auth.loginWithFirebase(body.idToken);
  }

  /**
   * GET /auth/me
   * Header: Authorization: Bearer <accessToken>
   * Returns: the decoded JWT payload (the current user)
   */
  @UseGuards(JwtAuthGuard)
  @Get("me")
  me(@CurrentUser() user: TokenPayload) {
    return user;
  }
}
