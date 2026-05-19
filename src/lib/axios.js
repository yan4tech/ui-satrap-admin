import axios from 'axios';

import { paths } from 'src/routes/paths';

import { CONFIG } from 'src/global-config';

import { JWT_STORAGE_KEY } from 'src/auth/context/jwt/constant';

import { getApiMode, getApiRequestMode } from './api-mode';
import { clearMembershipUserHeader } from './api-user-header';
import { clearBranchIdForApi, getBranchRequestHeaderValue } from './api-branch-header';
import { isSessionExpiredResponse, extractMembershipErrorMessage } from './membership-errors';

// ----------------------------------------------------------------------

const axiosInstance = axios.create({
  baseURL: CONFIG.serverUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

function applyHeader(config, key, value) {
  const h = config.headers;
  if (!h) {
    config.headers = { [key]: value };
    return;
  }
  if (typeof h.set === 'function') {
    h.set(key, value);
    return;
  }
  config.headers = { ...h, [key]: value };
}

axiosInstance.interceptors.request.use((config) => {
  const url = String(config.url ?? '');
  // Auth must send the real login mode (central stays central). Post-login APIs use getApiRequestMode().
  const isAuthLogin =
    url.includes('/api/membership/auth/submitMobile') || url.includes('/api/membership/auth/submitCode');
  const mode = isAuthLogin ? getApiMode() : getApiRequestMode();
  if (mode) {
    applyHeader(config, 'mode', mode);
  }
  const branch = getBranchRequestHeaderValue();
  if (branch != null) {
    applyHeader(config, 'branch', branch);
  }
  return config;
});

function handleSessionExpired() {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(JWT_STORAGE_KEY);
    clearMembershipUserHeader();
    clearBranchIdForApi();
    delete axiosInstance.defaults.headers.common.Authorization;
  } catch {
    // ignore
  }
  const signIn = paths.auth.jwt.signIn;
  const here = `${window.location.pathname}${window.location.search}`;
  if (!window.location.pathname.startsWith(signIn)) {
    const next = encodeURIComponent(here);
    window.location.href = `${signIn}?session=expired&next=${next}`;
  }
}

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (isSessionExpiredResponse(error)) {
      handleSessionExpired();
    }
    const message = extractMembershipErrorMessage(error);
    console.error('Axios error:', message);
    const wrapped = new Error(message);
    wrapped.response = error?.response;
    wrapped.isSessionExpired = isSessionExpiredResponse(error);
    return Promise.reject(wrapped);
  }
);

export default axiosInstance;

// ----------------------------------------------------------------------

export const fetcher = async (args) => {
  try {
    const [url, config] = Array.isArray(args) ? args : [args, {}];

    const res = await axiosInstance.get(url, config);

    return res.data;
  } catch (error) {
    console.error('Fetcher failed:', error);
    throw error;
  }
};

// ----------------------------------------------------------------------

export const endpoints = {
  chat: '/api/chat',
  kanban: '/api/kanban',
  calendar: '/api/calendar',
  auth: {
    me: '/api/membership/user/me',
    logout: '/api/membership/user/logout',
    signIn: '/api/auth/sign-in',
    submitMobile: '/api/membership/auth/submitMobile',
    submitCode: '/api/membership/auth/submitCode',
    signUp: '/api/auth/sign-up',
  },
  mail: {
    list: '/api/mail/list',
    details: '/api/mail/details',
    labels: '/api/mail/labels',
  },
  post: {
    list: '/api/post/list',
    details: '/api/post/details',
    latest: '/api/post/latest',
    search: '/api/post/search',
  },
  product: {
    list: '/api/product/list',
    details: '/api/product/details',
    search: '/api/product/search',
  },
};
