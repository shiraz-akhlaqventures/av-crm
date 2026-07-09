import {
  createParamDecorator,
  ExecutionContext,
} from "@nestjs/common";
import type { Request } from "express";
import type { TokenPayload } from "@av-crm/shared-types";

/**
 * Express's Request doesn't know about `user`; cast through unknown.
 */
type RequestWithUser = Request & { user?: TokenPayload };

/**
 * Pulls the JWT payload off the request.
 * Use with @UseGuards(JwtAuthGuard):
 *
 *   async handler(@CurrentUser() user: TokenPayload) { ... }
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): TokenPayload => {
    const req = ctx.switchToHttp().getRequest<RequestWithUser>();
    return req.user as TokenPayload;
  },
);
