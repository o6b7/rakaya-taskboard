// src/api/auth.api.ts
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import bcrypt from "bcryptjs";
import jwtEncode from "jwt-encode";
import { jwtDecode } from "jwt-decode";
import type {
  LoginCredentials,
  AuthResponse,
  SignupCredentials,
  User,
  UserProfile,
} from "../types";
import { generateUniqueId } from "../utils/idGenerator";

const SECRET_KEY = import.meta.env.VITE_JWT_SECRET_KEY;

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
            `http://localhost:3000/users?email=${credentials.email}`
          );
          if (!response.ok) throw new Error("Failed to fetch users");

          const users = await response.json();
          if (!users.length) throw new Error("User not found");

          const user = users[0];
          const valid = await bcrypt.compare(credentials.password, user.password);
          if (!valid) throw new Error("Invalid credentials");

          const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour
          const payload = { userId: user.id, role: user.role, exp: expiresAt };
          const token = jwtEncode(payload, SECRET_KEY);

          localStorage.setItem("authToken", token);
          localStorage.setItem("authUser", JSON.stringify(user));

          return { data: { user, token } };
        } catch (error: any) {
          return { error: { status: "CUSTOM_ERROR", error: error.message } };
        }
      },
      invalidatesTags: ["Auth"],
    }),

    signup: builder.mutation<User, { userData: SignupCredentials; creatorToken?: string }>({
      queryFn: async ({ userData, creatorToken }) => {
        try {
          // Only check token if creatorToken is provided (for owner creating users)
          if (creatorToken) {
            const decoded: any = jwtDecode(creatorToken);
            if (decoded.role !== "owner") throw new Error("Only owner can create accounts");
            if (decoded.exp < Date.now()) throw new Error("Token expired");
          }

          const hashed = await bcrypt.hash(userData.password, 10);
          const newUser = {
            id: generateUniqueId("users"),
            name: userData.name,
            email: userData.email,
            password: hashed,
            avatar: userData.avatar || "/assets/default-avatar.png",
            role: userData.role || "member",
            createdAt: new Date().toISOString(),
          };

          const response = await fetch("http://localhost:3000/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newUser),
          });

          if (!response.ok) throw new Error("Failed to create user");

          const result = await response.json();
          return { data: result };
        } catch (error: any) {
          return { error: { status: "CUSTOM_ERROR", error: error.message } };
        }
      },
      invalidatesTags: ["User"],
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
          const isValid = decoded.exp > Date.now();
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