import type { UserRole } from "./user";

export type CreateUserPayload = {
  first_name: string;
  last_name: string;
  email: string;
  role: UserRole;
  department_id?: number;
  staff_type?: "academic" | "non-academic";
};

export type RegistryUserRow = {
  id: number;
  first_name: string | null;
  last_name: string | null;
  email: string;
  profile_picture_url: string | null;
  is_active: boolean;
  email_verified: boolean;
  role: UserRole,
  department_id: number | null;
  department_name: string;
};

export type CreateUserResult = {
  ok: boolean;
  reason?: string;
  user?: Pick<RegistryUserRow, "id" | "first_name" | "last_name" | "email" | "role">;
  message?: string;
};

export type ListParams = {
  page: number;
  limit: number;
  search?: string;
  role?: UserRole | string;
  department_id?: number;
};

export type ListResult = {
  data: RegistryUserRow[];
  meta: { page: number; limit: number; total: number; totalPages: number };
};

export type UpdateUserBody = {
  first_name?: string;
  last_name?: string;
  email?: string;
  is_active?: boolean;
};