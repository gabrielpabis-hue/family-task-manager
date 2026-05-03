export type UserRole = "admin" | "child";

export const ROLE_MAP: Record<string, UserRole> = {
  "alicja.b.pabis@gmail.com": "admin",
  "gabriel.pabis@gmail.com": "admin",
  "igipabis@gmail.com": "child",
  "gabik.pabik@gmail.com": "child",
};

export function getUserRole(email: string | null | undefined): UserRole | null {
  if (!email) return null;
  return ROLE_MAP[email.toLowerCase()] ?? null;
}