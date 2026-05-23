import axios from 'src/lib/axios';

import { fetchMyCentralBranch } from './branch-api';

export { fetchMyCentralBranch };

export async function updateCentralBranch(branchId, payload) {
  const res = await axios.put(`/api/membership/branch/${branchId}`, payload);
  return res?.data ?? null;
}
