// ----------------------------------------------------------------------

const ROOTS = {
  AUTH: '/auth',
  DASHBOARD: '/dashboard',
};

// ----------------------------------------------------------------------

export const paths = {
  faqs: '/faqs',
  minimalStore: 'https://mui.com/store/items/minimal-dashboard/',
  // AUTH
  auth: {
    amplify: {
      signIn: `${ROOTS.AUTH}/amplify/sign-in`,
      verify: `${ROOTS.AUTH}/amplify/verify`,
      signUp: `${ROOTS.AUTH}/amplify/sign-up`,
      updatePassword: `${ROOTS.AUTH}/amplify/update-password`,
      resetPassword: `${ROOTS.AUTH}/amplify/reset-password`,
    },
    jwt: {
      signIn: `${ROOTS.AUTH}/jwt/sign-in`,
      signUp: `${ROOTS.AUTH}/jwt/sign-up`,
    },
    firebase: {
      signIn: `${ROOTS.AUTH}/firebase/sign-in`,
      verify: `${ROOTS.AUTH}/firebase/verify`,
      signUp: `${ROOTS.AUTH}/firebase/sign-up`,
      resetPassword: `${ROOTS.AUTH}/firebase/reset-password`,
    },
    auth0: {
      signIn: `${ROOTS.AUTH}/auth0/sign-in`,
    },
    supabase: {
      signIn: `${ROOTS.AUTH}/supabase/sign-in`,
      verify: `${ROOTS.AUTH}/supabase/verify`,
      signUp: `${ROOTS.AUTH}/supabase/sign-up`,
      updatePassword: `${ROOTS.AUTH}/supabase/update-password`,
      resetPassword: `${ROOTS.AUTH}/supabase/reset-password`,
    },
  },
  // DASHBOARD
  dashboard: {
    root: ROOTS.DASHBOARD,
    two: `${ROOTS.DASHBOARD}/two`,
    services: {
      list: `${ROOTS.DASHBOARD}/services/list`,
      one: `${ROOTS.DASHBOARD}/services/one`,
    },
    group: {
      root: `${ROOTS.DASHBOARD}/group`,
      five: `${ROOTS.DASHBOARD}/group/five`,
      six: `${ROOTS.DASHBOARD}/group/six`,
    },
    branch: {
      create: `${ROOTS.DASHBOARD}/branch/create`,
      search: `${ROOTS.DASHBOARD}/branch/search`,
      edit: (id) => `${ROOTS.DASHBOARD}/branch/edit/${id}`,
      /** Same screen as edit, read-only (no save). */
      details: (id) => `${ROOTS.DASHBOARD}/branch/edit/${id}?view=1`,
    },
    role: {
      create: `${ROOTS.DASHBOARD}/role/create`,
      search: `${ROOTS.DASHBOARD}/role/search`,
      edit: (id) => `${ROOTS.DASHBOARD}/role/edit/${id}`,
      details: (id) => `${ROOTS.DASHBOARD}/role/edit/${id}?view=1`,
    },
    permission: {
      create: `${ROOTS.DASHBOARD}/permission/create`,
      search: `${ROOTS.DASHBOARD}/permission/search`,
      edit: (id) => `${ROOTS.DASHBOARD}/permission/edit/${id}`,
      details: (id) => `${ROOTS.DASHBOARD}/permission/edit/${id}?view=1`,
    },
    user: {
      create: `${ROOTS.DASHBOARD}/user/create`,
      search: `${ROOTS.DASHBOARD}/user/search`,
      edit: (id) => `${ROOTS.DASHBOARD}/user/edit/${id}`,
      details: (id) => `${ROOTS.DASHBOARD}/user/edit/${id}?view=1`,
    },
    processDefinition: {
      search: `${ROOTS.DASHBOARD}/process-definition/search`,
      edit: (id) => `${ROOTS.DASHBOARD}/process-definition/edit/${id}`,
      details: (id) => `${ROOTS.DASHBOARD}/process-definition/edit/${id}?view=1`,
    },
  },
};
