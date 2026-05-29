export type UserRole = 
  | "super-admin" 
  | "event-organiser"
  | "staff" 
  | "student";


export type PublicUser = {
  id: number;
  first_name: string | null; // Made optional per your schema update
  last_name: string | null;  // Made optional per your schema update
  email: string;
  
  // Transitioned to support multiple roles
  role: UserRole; 
  
  email_verified: boolean;
  is_active: boolean;
  two_factor_enabled: boolean;
  profile_picture_url: string | null;
  created_at: Date;
  updated_at: Date;
};

export type Gender = "male" | "female" | "other" | null;