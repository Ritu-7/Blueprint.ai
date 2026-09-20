export type { ApiResponse, ApiResponseSuccess, ApiResponseError } from '@/lib/api/response';

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
