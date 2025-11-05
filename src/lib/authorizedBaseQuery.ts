// src/api/utils/authorizedBaseQuery.ts
import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { jwtDecode } from "jwt-decode";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const authorizedBaseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  prepareHeaders: (headers) => {
    const token = localStorage.getItem("authToken");

    if (token) {
      try {
        const decoded: any = jwtDecode(token);

        const isExpired = decoded.exp && Date.now() >= decoded.exp;
        if (!isExpired) {
          headers.set("authorization", `Bearer ${token}`);
        }
      } catch (error) {
        throw new Error("Invalid token. Please log in again.");
      }
    }

    headers.set("Content-Type", "application/json");
    return headers;
  },
});


/**
 * Validate JWT token & optionally enforce role.
 */
export function validateToken(requiredRole?: "owner" | "member") {
  const token = localStorage.getItem("authToken");
  if (!token) return false;

  try {
    const decoded: any = jwtDecode(token);
    const isExpired = decoded.exp && Date.now() >= decoded.exp;

    if (isExpired) {
      return false;
    }

    if (requiredRole && decoded.role !== requiredRole) {
      return false;
    }

    return decoded;
  } catch {
    return false;
  }
}
