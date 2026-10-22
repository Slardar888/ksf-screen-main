/* ------------------------------------------------------------------ *
 * 演示环境凭据与登录态。
 * 原实现把密码散落在 LoginPage 与 MainMenuPage 两处硬编码，这里统一收口，
 * 并补上此前缺失的登出能力。
 * ------------------------------------------------------------------ */

export const AUTH_KEY = "mes-auth";

export const DEMO_CREDENTIALS = {
  username: "admin",
  password: "admin123",
} as const;

/** 管理员二次校验口令（进入「系统管理员」页前使用） */
export const ADMIN_PASSWORD = "admin123";

export function verifyCredentials(username: string, password: string): boolean {
  return (
    username === DEMO_CREDENTIALS.username &&
    password === DEMO_CREDENTIALS.password
  );
}

export function verifyAdminPassword(password: string): boolean {
  return password === ADMIN_PASSWORD;
}

export function isAuthed(): boolean {
  if (typeof localStorage === "undefined") return false;
  return localStorage.getItem(AUTH_KEY) === "1";
}

export function signIn(): void {
  localStorage.setItem(AUTH_KEY, "1");
}

export function signOut(): void {
  localStorage.removeItem(AUTH_KEY);
}
