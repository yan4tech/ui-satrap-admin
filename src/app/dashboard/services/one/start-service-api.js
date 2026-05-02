/** TODO: replace with real auth / env base URL */
export const SERVICE_START_URL =
  'http://localhost:3503/api/engine/service/start/service1';

export const HARDCODED_USER_HEADER =
  '{"ID":4,"CreatedAt":"2026-05-02T10:21:22.932045+03:30","UpdatedAt":"2026-05-02T10:21:22.932045+03:30","DeletedAt":null,"name":"","family":"","email":"","mobile":"09133333333","role_id":0,"branch_id":0,"user_type":"mobile","active":true,"verified":true,"last_login_at":"2026-05-02T10:21:22.931482+03:30"}';

export async function startService() {
  const res = await fetch(SERVICE_START_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      user: HARDCODED_USER_HEADER,
    },
    body: JSON.stringify({
      request_type: 1,
      service_type: 1,
      applicant_name: 'Test User',
    }),
  });

  let data = {};
  try {
    data = await res.json();
  } catch {
    data = {};
  }

  if (!res.ok || data.status !== 'success' || data.process_instance_id == null) {
    const msg =
      (typeof data.message === 'string' && data.message) ||
      (typeof data.error === 'string' && data.error) ||
      'شروع خدمت ناموفق بود.';
    throw new Error(msg);
  }

  return data.process_instance_id;
}
