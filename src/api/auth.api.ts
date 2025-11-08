import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import bcrypt from "bcryptjs";
import jwtEncode from "jwt-encode";
import { jwtDecode } from "jwt-decode";
import type {
  LoginCredentials,
  AuthResponse,
  SignupCredentials,
  UserProfile,
} from "../types";

const SECRET_KEY = import.meta.env.VITE_JWT_SECRET_KEY;
const API_URL = import.meta.env.VITE_API_URL;

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL,
    prepareHeaders: (headers) => {
      headers.set("Content-Type", "application/json");
      return headers;
    },
  }),
  tagTypes: ["Auth", "User"],
  endpoints: (builder) => ({
    login: builder.mutation<AuthResponse, LoginCredentials>({
      queryFn: async (credentials) => {
        try {
          const response = await fetch(
            `${API_URL}/users?email=${credentials.email}`
          );
          if (!response.ok) throw new Error("Failed to fetch users");

          const users = await response.json();
          if (!users.length) throw new Error("User not found");

          const user = users[0];
          if (!user.authorized) {
            throw new Error("Your account is awaiting owner approval. Please contact the administrator.");
          }
          const valid = await bcrypt.compare(credentials.password, user.password);
          if (!valid) throw new Error("Invalid credentials");

          const expiresAt = Math.floor(Date.now() / 1000) + 5 * 60 * 60; 
          const payload = { userId: user.id, role: user.role, exp: expiresAt };
          const token = jwtEncode(payload, SECRET_KEY);


          localStorage.setItem("authToken", token);
          localStorage.setItem("authUser", JSON.stringify(user));

          const { password: _, ...safeUser } = user;
          return { data: { user: safeUser as UserProfile, token } };
        } catch (error: any) {
          return { error: { status: "CUSTOM_ERROR", error: error.message } };
        }
      },
      invalidatesTags: ["Auth"],
    }),

    signup: builder.mutation<AuthResponse, { userData: SignupCredentials }>({
      queryFn: async ({ userData }) => {
        try {
          // ---- 1. Email uniqueness ----
          const checkResponse = await fetch(`${API_URL}/users`);
          if (!checkResponse.ok) throw new Error("Failed to check existing users");
          const existingUsers = await checkResponse.json();

          const userExists = existingUsers.some(
            (u: any) => u.email.toLowerCase() === userData.email.toLowerCase()
          );
          if (userExists) throw new Error("User with this email already exists");


          // ---- 2. Hash password ----
          if (!userData.password) throw new Error("Password is required");
          const hashedPassword = await bcrypt.hash(userData.password, 10);

          // ---- 3. Build new user (authorized = false) ----
          const newUser = {
            name: userData.name,
            email: userData.email,
            password: hashedPassword,
            avatar: userData.avatar || "/assets/default-avatar.png",
            role: userData.role || "member",
            createdAt: new Date().toISOString(),
            authorized: false,               // NEW
          };

          // ---- 4. POST to json-server ----
          const response = await fetch(`${API_URL}/users`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newUser),
          });
          if (!response.ok) throw new Error("Failed to create user");
          const createdUser = await response.json();

          // ---- 5. Return **without** token ----
          const { password: _, ...userWithoutPassword } = createdUser;
          return {
            data: {
              user: userWithoutPassword as UserProfile,
              token: "",
            },
          };
        } catch (error: any) {
          return {
            error: { status: "CUSTOM_ERROR", error: error.message },
          };
        }
      },
      invalidatesTags: ["User", "Auth"],
    }),

    getCurrentUser: builder.query<UserProfile, string>({
      query: (userId) => `/users/${userId}`,
      providesTags: ["Auth"],
    }),

    verifyToken: builder.query<boolean, void>({
      queryFn: async () => {
        const token = localStorage.getItem("authToken");
        if (!token) return { data: false };

        try {
          const decoded: any = jwtDecode(token);
          const isValid = decoded.exp * 1000 > Date.now();
          return { data: isValid };
        } catch {
          return { data: false };
        }
      },
      providesTags: ["Auth"],
    }),
  }),
});

export const authFunctions = {
  logout: () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
  },

  getStoredAuth: () => {
    const token = localStorage.getItem("authToken");
    const user = localStorage.getItem("authUser");
    return { token, user: user ? JSON.parse(user) : null };
  },

  isTokenValid: (): boolean => {
    const token = localStorage.getItem("authToken");
    if (!token) return false;
    try {
      const decoded: any = jwtDecode(token);
      return decoded.exp > Date.now();
    } catch {
      return false;
    }
  },
};

export const {
  useLoginMutation,
  useSignupMutation,
  useGetCurrentUserQuery,
  useVerifyTokenQuery,
} = authApi;