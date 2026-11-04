export type Role = 'ADMIN' | 'TEACHER' | 'STUDENT';

export interface AdminUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  enabled: boolean;
  deactivatedAt: string | null;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

export interface UpdateUserPayload {
  firstName: string;
  lastName: string;
  email: string;
}

export interface UserFilters {
  q?: string;
  role?: Role;
  enabled?: boolean;
  page: number;
  size: number;
}

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Administration',
  TEACHER: 'Teacher',
  STUDENT: 'Student',
};
