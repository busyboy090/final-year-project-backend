export type UserRole = 
  | "super-admin" 
  | "faculty-admin" 
  | "student-affairs" 
  | "department-admin" 
  | "event-organiser" 
  | "staff" 
  | "src-exec" 
  | "student";

/**
 * Represents the structure of a permission as it comes from the DB
 */
export type UserPermission = {
  name: string;   // e.g., 'create_event'
  module: string; // e.g., 'events'
};

export type PublicUser = {
  id: number;
  first_name: string | null; // Made optional per your schema update
  last_name: string | null;  // Made optional per your schema update
  email: string;
  
  // Transitioned to support multiple roles
  roles: UserRole[]; 
  
  // Flattened permissions for easy frontend checks
  permissions: string[]; 
  
  email_verified: boolean;
  is_active: boolean;
  two_factor_enabled: boolean;
  profile_picture_url: string | null;
  created_at: Date;
  updated_at: Date;
};