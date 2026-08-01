import { NextResponse } from 'next/server';

export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errorCode: string;
  details?: Record<string, any>;
}

export function apiSuccess<T>(data: T, message = 'Success', status = 200) {
  return NextResponse.json<ApiSuccessResponse<T>>(
    {
      success: true,
      message,
      data,
    },
    { status }
  );
}

export function apiError(message: string, errorCode = 'SERVER_001', status = 400, details?: Record<string, any>) {
  return NextResponse.json<ApiErrorResponse>(
    {
      success: false,
      message,
      errorCode,
      details,
    },
    { status }
  );
}
