// src/api/utils/authorizedBaseQuery.ts
import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { jwtDecode } from "jwt-decode";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const authorizedBaseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  prepareHeaders: (headers, { getState }) => {
    
    const token = localStorage.getItem("authToken");
    
    if (!token) {
      throw new Error("Missing token. Please log in first.");
    }
    
    // Validate token expiration
    try {
      const decoded: any = jwtDecode(token);
      
      const isExpired = decoded.exp && Date.now() >= decoded.exp * 1000;
      
      if (isExpired) {
        throw new Error("Session expired. Please log in again.");
      }
      
    } catch (error) {
      throw new Error("Invalid token. Please log in again.");
    }
    
    headers.set("authorization", `Bearer ${token}`);
    headers.set("Content-Type", "application/json");
    
    return headers;
  },
});

/**
 * Validate JWT token & optionally enforce role.
 */
export function validateToken(requiredRole?: "owner" | "member") {
  
  const token = localStorage.getItem("authToken");
  
  if (!token) throw new Error("Unauthorized: Token missing.");

  const decoded: any = jwtDecode(token);
  
  const isExpired = decoded.exp && Date.now() >= decoded.exp * 1000;
  
  if (isExpired) throw new Error("Session expired. Please log in again.");

  if (requiredRole && decoded.role !== requiredRole)
    throw new Error(`Access denied. Requires role: ${requiredRole}`);

  return decoded;
}