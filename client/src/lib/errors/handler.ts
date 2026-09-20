import { NextResponse } from 'next/server';
import { AppError } from './AppError';
import { logger } from '../logger/logger';

export function handleApiError(error: unknown, routeTag = 'api'): NextResponse {
  if (error instanceof AppError) {
    logger.warn(`Handled error in [${routeTag}]: ${error.message}`, routeTag, {
      code: error.code,
      statusCode: error.statusCode,
      details: error.details,
    });

    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: error.code,
        details: error.details,
      },
      { status: error.statusCode }
    );
  }

  const message = error instanceof Error ? error.message : 'An unknown error occurred';
  logger.error(`Unhandled error in [${routeTag}]: ${message}`, routeTag, error);

  return NextResponse.json(
    {
      success: false,
      error: message,
      code: 'INTERNAL_SERVER_ERROR',
    },
    { status: 500 }
  );
}
