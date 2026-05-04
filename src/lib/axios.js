import axios from 'axios';

import { CONFIG } from 'src/global-config';

import { getApiMode } from './api-mode';
import { getBranchRequestHeaderValue } from './api-branch-header';

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
  const mode = getApiMode();
  if (mode) {
    applyHeader(config, 'mode', mode);
  }
  const branch = getBranchRequestHeaderValue();
  if (branch != null) {
    applyHeader(config, 'branch', branch);
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error?.response?.data?.message || error?.message || 'Something went wrong!';
    console.error('Axios error:', message);
    return Promise.reject(new Error(message));
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
