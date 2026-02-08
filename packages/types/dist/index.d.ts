export type Role = "customer" | "provider" | "admin";
export type JwtClaims = {
    sub: string;
    role: Role;
    email: string;
};
export type ServiceListItem = {
    id: string;
    creatorId: string;
    title: string;
    description: string;
    categoryId: string | null;
    basePrice: string;
    durationMinutes: number;
    active: boolean;
    featuredRank: number | null;
    createdAt: string;
};
export type Paged<T> = {
    items: T[];
    page: number;
    pageSize: number;
    total: number;
};
export type ApiError = {
    error: string;
    details?: unknown;
};
