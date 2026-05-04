'use client';

import axios, { endpoints } from 'src/lib/axios';

import { setSession } from './utils';
import { JWT_STORAGE_KEY, JWT_REFRESH_STORAGE_KEY } from './constant';

// ----------------------------------------------------------------------

/** **************************************
 * Sign in
 *************************************** */
export const signInWithPassword = async ({ email, password }) => {
  try {
    const params = { email, password };

    const res = await axios.post(endpoints.auth.signIn, params);

    const { accessToken } = res.data;

    if (!accessToken) {
      throw new Error('Access token not found in response');
    }

    setSession(accessToken);
  } catch (error) {
    console.error('Error during sign in:', error);
    throw error;
  }
};

/** **************************************
 * Sign in (mobile step 1)
 *************************************** */
export const submitMobile = async ({ mobile }) => {
  const res = await axios.post(endpoints.auth.submitMobile, { mobile });

  if (res?.data?.status !== 'success') {
    throw new Error('ارسال کد تایید ناموفق بود.');
  }

  return res.data;
};

/** **************************************
 * Sign in (mobile step 2)
 *************************************** */
export const submitMobileCode = async ({ mobile, code }) => {
  const res = await axios.post(endpoints.auth.submitCode, {
    mobile,
    code: Number(code),
  });

  const accessToken = res?.data?.access_token;
  const refreshToken = res?.data?.refresh_token;
  const status = res?.data?.status;

  if (!accessToken || status !== 'success') {
    throw new Error('کد تایید نامعتبر است یا ورود انجام نشد.');
  }

  await setSession(accessToken);

  if (refreshToken) {
    sessionStorage.setItem(JWT_REFRESH_STORAGE_KEY, refreshToken);
  }

  return { accessToken, refreshToken };
};

/** **************************************
 * Sign up
 *************************************** */
export const signUp = async ({ email, password, firstName, lastName }) => {
  const params = {
    email,
    password,
    firstName,
    lastName,
  };

  try {
    const res = await axios.post(endpoints.auth.signUp, params);

    const { accessToken } = res.data;

    if (!accessToken) {
      throw new Error('Access token not found in response');
    }

    sessionStorage.setItem(JWT_STORAGE_KEY, accessToken);
  } catch (error) {
    console.error('Error during sign up:', error);
    throw error;
  }
};

/** **************************************
 * Sign out
 *************************************** */
export const signOut = async () => {
  try {
    const res = await axios.get(endpoints.auth.logout);

    if (res?.data?.status !== 'success') {
      throw new Error('خروج از حساب کاربری ناموفق بود.');
    }

    await setSession(null);
    sessionStorage.removeItem(JWT_REFRESH_STORAGE_KEY);
  } catch (error) {
    console.error('Error during sign out:', error);
    throw error;
  }
};
