import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import type { Request, Response } from "express";

/**
 * Global exception filter.
 *
 * Logs every unhandled exception with its full stack trace so it
 * appears in Render's "Logs" tab, and returns the error message
 * to the client so it's visible in the browser Network tab.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger("Exception");

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const isHttp = exception instanceof HttpException;
    const status = isHttp
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = isHttp
      ? exception.message
      : exception instanceof Error
        ? exception.message
        : String(exception);

    // Log with stack trace so it appears in Render logs.
    const stack =
      exception instanceof Error ? exception.stack : undefined;
    this.logger.error(
      `[${req.method} ${req.url}] ${status} ${message}`,
      stack,
    );

    res.status(status).json({
      statusCode: status,
      message,
      path: req.url,
      timestamp: new Date().toISOString(),
    });
  }
}
