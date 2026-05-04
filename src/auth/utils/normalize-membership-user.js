/**
 * شکل دادهٔ `GET /api/membership/user/me` را با فیلدهای مورد انتظار UI هم‌راستا می‌کند.
 * نام نمایشی از `name` + `family`؛ در نبود هر دو از موبایل یا ایمیل.
 */
export function normalizeMembershipUser(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const name = String(raw.name ?? '').trim();
  const family = String(raw.family ?? '').trim();
  const fullName = [name, family].filter(Boolean).join(' ').trim();

  const mobile = String(raw.mobile ?? raw.phoneNumber ?? raw.phone_number ?? '').trim();
  const email = String(raw.email ?? '').trim();

  const displayName =
    fullName ||
    mobile ||
    email ||
    (raw.ID != null ? `کاربر ${raw.ID}` : '') ||
    'کاربر';

  const photoURL =
    raw.photoURL ?? raw.photo_url ?? raw.avatar ?? raw.avatar_url ?? raw.AvatarURL ?? null;

  const role =
    raw.role != null && String(raw.role).trim() !== ''
      ? String(raw.role).trim()
      : raw.role_id != null
        ? `role_${raw.role_id}`
        : 'admin';

  return {
    ...raw,
    displayName,
    email,
    mobile,
    photoURL: photoURL || null,
    role,
  };
}
