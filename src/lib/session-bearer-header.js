import { JWT_STORAGE_KEY } from 'src/auth/context/jwt/constant';

/** مقدار هدر `Authorization: Bearer …` از sessionStorage (برای fetch جدا از axios) */
export function getSessionBearerAuthorization() {
  if (typeof window === 'undefined') return '';
  try {
    const t = window.sessionStorage.getItem(JWT_STORAGE_KEY);
    const token = t != null ? String(t).trim() : '';
    return token ? `Bearer ${token}` : '';
  } catch {
    return '';
  }
}
