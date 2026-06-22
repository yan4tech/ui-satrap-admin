/**
 * Demo workflow helpers — mock sendAgency after manual review approval in local/demo stacks.
 * Review steps (review1 / review2) stay manual unless NEXT_PUBLIC_DEMO_AUTO_APPROVE_REVIEWS=true.
 * Set NEXT_PUBLIC_DEMO_MOCK_SEND_AGENCY=false to disable sendAgency mock.
 */
export function isDemoAutoApproveReviews() {
  const v = String(
    typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_DEMO_AUTO_APPROVE_REVIEWS ?? '' : '',
  ).trim().toLowerCase();
  if (v === 'true' || v === '1' || v === 'yes') return true;
  return false;
}

export function isDemoMockSendAgency() {
  const v = String(
    typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_DEMO_MOCK_SEND_AGENCY ?? '' : '',
  ).trim().toLowerCase();
  if (v === 'false' || v === '0' || v === 'no') return false;
  if (v === 'true' || v === '1' || v === 'yes') return true;
  return process.env.NODE_ENV === 'development';
}

const SEND_AGENCY_ELEMENT_IDS = ['sendagency', 'sendagency1', 'sendagency2'];

export function isSendAgencyElementId(elementId) {
  const el = String(elementId ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '');
  return SEND_AGENCY_ELEMENT_IDS.some((id) => el === id || el.startsWith('sendagency'));
}
