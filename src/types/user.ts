export interface User {
  id: string;
  name: string;
  email: string; 
  avatar?: string;
  password: string; 
  role: string;
  createdAt?: string;
  authorized: boolean;
}

export interface UserProfile extends Omit<User, "password"> {
  // User without password for safe frontend use
}

export type NewUser = Omit<User, "id">;
