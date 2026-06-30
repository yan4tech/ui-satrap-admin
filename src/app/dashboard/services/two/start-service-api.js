import { getApiMode, getApiRequestMode } from 'src/lib/api-mode';
import { getBranchIdStored, getBranchRequestHeaderValue } from 'src/lib/api-branch-header';
import { getMembershipUserHeaderString } from 'src/lib/api-user-header';
import { getSessionBearerAuthorization } from 'src/lib/session-bearer-header';

import { engineApiUrl } from '../one/engine-api';

export const SERVICE_START_URL = engineApiUrl('/service/start/service2');

export async function startService() {
  const userHeader = getMembershipUserHeaderString();
  if (!userHeader) {
    throw new Error('اطلاعات کاربر برای موتور موجود نیست؛ لطفاً دوباره وارد شوید.');
  }
  if (getApiMode() === 'branch' && !getBranchIdStored()) {
    throw new Error('در حالت شعبه، شناسه شعبه (هدر branch) الزامی است.');
  }

  const headers = {
    'Content-Type': 'application/json',
    user: userHeader,
    mode: getApiRequestMode(),
  };
  const auth = getSessionBearerAuthorization();
  if (auth) {
    headers.Authorization = auth;
  }
  const branch = getBranchRequestHeaderValue();
  if (branch != null) {
    headers.branch = branch;
  }

  const res = await fetch(SERVICE_START_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      request_type: 1,
      service_type: 2,
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
