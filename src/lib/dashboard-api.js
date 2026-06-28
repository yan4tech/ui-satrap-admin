import { jsonHeaders, ENGINE_BASE_URL } from 'src/app/dashboard/services/one/engine-api';

// ----------------------------------------------------------------------

/**
 * @typedef {'up' | 'down'} DashboardTrend
 */

/**
 * @typedef {Object} DashboardMeta
 * @property {string} branch_name
 * @property {string} branch_code
 * @property {string} [user_name]
 * @property {string} [manager_name]
 * @property {string} [role_title]
 * @property {string} last_sync_at ISO-8601 timestamp
 */

/**
 * @typedef {Object} DashboardKpi
 * @property {string} title
 * @property {string} value
 * @property {string} change
 * @property {DashboardTrend} trend
 * @property {string} [icon]
 */

/**
 * @typedef {Object} ServiceBreakdownItem
 * @property {string} name
 * @property {number} waiting_review
 * @property {number} waiting_registry_reply
 * @property {number} completed
 * @property {number} rejected
 */

/**
 * @typedef {Object} BarItem
 * @property {string} label
 * @property {number} value
 * @property {string} [color]
 */

/**
 * @typedef {Object} InboxPreviewItem
 * @property {string} id
 * @property {string} service
 * @property {string} applicant
 * @property {string} wait
 * @property {string} [step]
 * @property {'high' | 'medium' | 'low' | string} priority
 * @property {number} [process_instance_id]
 * @property {number} [task_id]
 * @property {string} [definition_key]
 */

/**
 * @typedef {Object} TeamMemberItem
 * @property {string} name
 * @property {string} role
 * @property {string} status
 * @property {string} color
 */

/**
 * @typedef {Object} AlertItem
 * @property {string} label
 * @property {number} progress
 */

/**
 * @typedef {Object} ServiceStatusItem
 * @property {string} name
 * @property {string} state
 * @property {string} color
 */

/**
 * @typedef {Object} ActivityItem
 * @property {string} title
 * @property {string} subtitle
 * @property {string} icon
 */

/**
 * @typedef {Object} PulseStatItem
 * @property {string} label
 * @property {number} value
 * @property {string} hint
 * @property {string} icon
 */

/**
 * @typedef {Object} WeeklyGoal
 * @property {string} title
 * @property {string} subheader
 * @property {number} progress
 * @property {string} description
 */

/**
 * @typedef {Object} BranchOverviewResponse
 * @property {DashboardMeta} meta
 * @property {DashboardKpi[]} kpis
 * @property {ServiceBreakdownItem[]} service_breakdown
 * @property {number[]} weekly_activity
 * @property {BarItem[]} status_distribution
 * @property {BarItem[]} operator_performance
 * @property {InboxPreviewItem[]} pending_reviews
 * @property {TeamMemberItem[]} team_members
 * @property {AlertItem[]} alerts
 * @property {ServiceStatusItem[]} service_status
 * @property {ActivityItem[]} activities
 */

/**
 * @typedef {Object} UserOverviewResponse
 * @property {DashboardMeta} meta
 * @property {DashboardKpi[]} kpis
 * @property {PulseStatItem[]} pulse_stats
 * @property {ServiceBreakdownItem[]} service_breakdown
 * @property {number[]} weekly_activity
 * @property {BarItem[]} status_mix
 * @property {WeeklyGoal} weekly_goal
 * @property {InboxPreviewItem[]} inbox
 * @property {ActivityItem[]} timeline
 */

/**
 * @typedef {Object} DashboardEnvelope
 * @property {'success' | string} status
 * @property {BranchOverviewResponse | UserOverviewResponse} data
 * @property {string} [message]
 * @property {string} [error]
 */

// ----------------------------------------------------------------------

/** Thrown when dashboard API returns a non-success HTTP status. */
export class DashboardApiError extends Error {
  /**
   * @param {string} message
   * @param {number} status HTTP status code
   */
  constructor(message, status) {
    super(message);
    this.name = 'DashboardApiError';
    this.status = status;
  }
}

/** @param {unknown} error */
export function isDashboardForbiddenError(error) {
  return error instanceof DashboardApiError && error.status === 403;
}

function extractErrorMessage(data, fallback) {
  if (typeof data?.message === 'string' && data.message) return data.message;
  if (typeof data?.error === 'string' && data.error) return data.error;
  return fallback;
}

async function parseJson(res) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

function assertEngineSuccess(res, data, fallback) {
  if (!res.ok) {
    throw new DashboardApiError(extractErrorMessage(data, fallback), res.status);
  }
  if (data && Object.prototype.hasOwnProperty.call(data, 'status') && data.status !== 'success') {
    throw new DashboardApiError(extractErrorMessage(data, fallback), res.status);
  }
}

function unwrapDashboardData(envelope) {
  const root = envelope && typeof envelope === 'object' ? envelope : {};
  return root.data !== undefined ? root.data : root;
}

/**
 * @param {string} path
 * @param {{ params?: Record<string, string | number | undefined | null>, signal?: AbortSignal }} [options]
 * @returns {Promise<unknown>}
 */
async function dashboardRequest(path, { params, signal } = {}) {
  const url = new URL(`${ENGINE_BASE_URL}/api/engine/dashboard${path}`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });
  }

  let res;
  try {
    res = await fetch(url.toString(), {
      method: 'GET',
      headers: jsonHeaders(),
      signal,
    });
  } catch (e) {
    if (e?.name === 'AbortError') {
      throw e;
    }
    throw new Error(
      `اتصال به سرویس داشبورد برقرار نشد (${ENGINE_BASE_URL}). ${e?.message || ''}`.trim()
    );
  }

  const json = await parseJson(res);
  assertEngineSuccess(res, json, 'دریافت دادهٔ داشبورد ناموفق بود.');
  return unwrapDashboardData(json);
}

/**
 * @param {{ branchId?: string | number | null, signal?: AbortSignal }} [options]
 * @returns {Promise<BranchOverviewResponse>}
 */
export async function fetchBranchOverview({ branchId, signal } = {}) {
  /** @type {Record<string, string | number | undefined | null>} */
  const params = {};
  if (branchId !== undefined && branchId !== null && String(branchId).trim() !== '') {
    params.branch_id = branchId;
  }
  return /** @type {Promise<BranchOverviewResponse>} */ (
    dashboardRequest('/branch/overview', { params, signal })
  );
}

/**
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<UserOverviewResponse>}
 */
export async function fetchUserOverview({ signal } = {}) {
  return /** @type {Promise<UserOverviewResponse>} */ (
    dashboardRequest('/user/overview', { signal })
  );
}
