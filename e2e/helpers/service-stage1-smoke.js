// @ts-check
/**
 * Fixtures for service2/service4 page1 stage1 smoke tests.
 * Mocks membership session + engine instance/tasks so UI renders without a live backend.
 */

function createFakeJwt() {
  const exp = Math.floor(Date.now() / 1000) + 86400;
  const payload = Buffer.from(JSON.stringify({ exp }))
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return `e2e.${payload}.sig`;
}

const BASE_PERMISSIONS = [
  'ui.dashboard.view',
  'ui.services.inbox',
  'ui.services.list',
  'ui.services.process.timeline',
];

/**
 * @param {import('@playwright/test').Page} page
 * @param {{ servicePermission: string }} opts
 */
async function installDashboardSession(page, { servicePermission }) {
  const jwt = createFakeJwt();
  const user = {
    ID: 9001,
    id: 9001,
    name: 'E2E',
    family: 'Tester',
    branch_id: 0,
    permissions: [...BASE_PERMISSIONS, servicePermission],
  };
  const userJson = JSON.stringify(user);

  await page.addInitScript(
    ({ token, headerJson }) => {
      window.sessionStorage.setItem('jwt_access_token', token);
      window.sessionStorage.setItem('membership_user_json_header', headerJson);
      window.sessionStorage.setItem('api_mode', 'branch');
    },
    { token: jwt, headerJson: userJson },
  );

  await page.route('**/api/membership/user/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'success',
        data: { user, permissions: user.permissions },
      }),
    });
  });
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {{ processId: number, definitionKey: string, elementId: string }} cfg
 */
async function mockEngineAtStage1(page, { processId, definitionKey, elementId }) {
  const task = {
    ID: 101,
    element_id: elementId,
    type: 'USER_TASK',
    status: 'CREATED',
    process_instance_id: processId,
    attached_data: {},
    CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString(),
  };

  const instance = {
    ID: processId,
    id: processId,
    definition_key: definitionKey,
    status: 'RUNNING',
  };

  await page.route(`**/api/engine/service/tasks/${processId}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 'success', tasks: { 101: task } }),
    });
  });

  await page.route(`**/api/engine/service/instance/${processId}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 'success', data: instance }),
    });
  });

  await page.route(`**/api/engine/service/history/${processId}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 'success', history: [] }),
    });
  });
}

/** @param {import('@playwright/test').Page} page */
async function mockOptionalDashboardApis(page) {
  await page.route('**/api/membership/user/my-services', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 'success', data: [] }),
    });
  });

  await page.route('**/api/membership/notifications**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 'success', data: [] }),
    });
  });
}

module.exports = {
  createFakeJwt,
  installDashboardSession,
  mockEngineAtStage1,
  mockOptionalDashboardApis,
};
