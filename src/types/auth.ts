import type { UserProfile } from ".";

export interface LoginCredentials {
  email: string; 
  password: string;
}

export interface SignupCredentials {
  name: string;
  email: string;
  password: string;
  avatar?: string;
  role?: string;
}

export interface AuthResponse {
  user: UserProfile; 
  token: string;
}
