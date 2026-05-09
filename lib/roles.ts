export type UserRole = "superAdmin" | "familyAdmin" | "parent" | "child";
export type LegacyRole = "admin" | "child";

export const SUPER_ADMIN_EMAIL = "gabriel.pabis@gmail.com";

// Legacy map kept for middleware backward compatibility
export const LEGACY_ROLE_MAP: Record<string, LegacyRole> = {
  "alicja.b.pabis@gmail.com": "admin",
  "gabriel.pabis@gmail.com": "admin",
  "igipabis@gmail.com": "child",
  "gabik.pabik@gmail.com": "child",
};

export function getUserRole(email: string | null | undefined): LegacyRole | null {
  if (!email) return null;
  return LEGACY_ROLE_MAP[email.toLowerCase()] ?? null;
}

export function isSuperAdmin(email: string | null | undefined): boolean {
  return !!email && email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
}

export function isAdminRole(role: UserRole | null): boolean {
  return role === "superAdmin" || role === "familyAdmin";
}
