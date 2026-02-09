// This module defines common TypeScript types used across the application.

// Defines the possible roles for a user.
export type Role = "customer" | "provider" | "admin";

// Defines the structure of JWT claims.
export type JwtClaims = {
  sub: string;
  role: Role;
  email: string;
};

// Defines the structure of a service list item.
export type ServiceListItem = {
  id: string;
  creatorId: string;
  title: string;
  description: string;
  categoryId: string | null;
  basePrice: string; // decimal as string
  durationMinutes: number;
  active: boolean;
  featuredRank: number | null;
  createdAt: string;
};

// Defines the structure for paginated responses.
export type Paged<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
};

// Defines the structure for API error responses.
export type ApiError = {
  error: string;
  details?: unknown;
};
