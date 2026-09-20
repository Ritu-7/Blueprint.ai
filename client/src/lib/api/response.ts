import { NextResponse } from 'next/server';

export interface ApiResponseSuccess<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiResponseError {
  success: false;
  error: string;
  code?: string;
  details?: unknown;
}

export type ApiResponse<T> = ApiResponseSuccess<T> | ApiResponseError;

export function apiSuccess<T>(data: T, status = 200, meta?: Record<string, unknown>): NextResponse<ApiResponseSuccess<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(meta ? { meta } : {}),
    },
    { status }
  );
}

export function apiError(
  message: string,
  status = 500,
  code = 'SERVER_ERROR',
  details?: unknown
): NextResponse<ApiResponseError> {
  return NextResponse.json(
    {
      success: false,
      error: message,
      code,
      ...(details ? { details } : {}),
    },
    { status }
  );
}
