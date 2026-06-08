import { paths } from 'src/routes/paths';

import { CONFIG } from 'src/global-config';
import { PERM } from 'src/lib/permissions';
import {
  BRANCH_DASHBOARD_NAV_PERMISSIONS,
  BRANCH_USER_DASHBOARD_NAV_PERMISSIONS,
} from 'src/lib/dashboard-nav-permissions';

import { SvgColor } from 'src/components/svg-color';

// ----------------------------------------------------------------------

const icon = (name) => <SvgColor src={`${CONFIG.assetsDir}/assets/icons/navbar/${name}.svg`} />;

const ICONS = {
  dashboard: icon('ic-dashboard'),
  branch: icon('ic-dashboard'),
  role: icon('ic-label'),
  permission: icon('ic-lock'),
  userMgmt: icon('ic-user'),
  services: icon('ic-menu-item'),
  serviceOne: icon('ic-tour'),
  serviceTwo: icon('ic-kanban'),
  serviceThree: icon('ic-course'),
  list: icon('ic-file'),
  create: icon('ic-order'),
  banking: icon('ic-banking'),
};

const BRANCH_MANAGE_PERMISSIONS = [
  PERM.ui.branchCentralList,
  PERM.ui.branchCentralCreate,
  PERM.ui.branchCentral,
  PERM.ui.branchTenantList,
  PERM.ui.branchTenantCreate,
  PERM.ui.branchTenant,
  PERM.ui.companyTenantManage,
];

// ----------------------------------------------------------------------

export const navData = [
  {
    subheader: 'داشبورد',
    items: [
      {
        title: 'داشبورد شعبه مرکزی',
        path: paths.dashboard.root,
        icon: ICONS.dashboard,
        requiredPermissions: [PERM.ui.dashboardView],
      },
      {
        title: 'داشبورد شعبه',
        path: paths.dashboard.branch.overview,
        icon: ICONS.branch,
        anyPermissions: BRANCH_DASHBOARD_NAV_PERMISSIONS,
      },
      {
        title: 'داشبورد کاربر شعبه',
        path: paths.dashboard.branch.userOverview,
        icon: ICONS.banking,
        anyPermissions: BRANCH_USER_DASHBOARD_NAV_PERMISSIONS,
      },
    ],
  },
  {
    subheader: 'مالی',
    items: [
      {
        title: 'گزارش دریافتی‌ها',
        path: paths.dashboard.finance.receipts,
        icon: ICONS.banking,
        requiredPermissions: [PERM.ui.financeList],
      },
    ],
  },
  {
    subheader: 'مدیریت',
    items: [
      {
        title: 'مدیریت کاربران',
        path: paths.dashboard.user.search,
        icon: ICONS.userMgmt,
        anyPermissions: [
          PERM.ui.usersList,
          PERM.ui.rolesList,
          PERM.ui.roleDelegationManage,
          PERM.ui.permissionsList,
          PERM.ui.auditList,
        ],
        children: [
          {
            title: 'کاربر',
            path: paths.dashboard.user.create,
            icon: ICONS.userMgmt,
            anyPermissions: [PERM.ui.usersList, PERM.ui.usersCreate],
            children: [
              { title: 'جدید', path: paths.dashboard.user.create, requiredPermissions: [PERM.ui.usersCreate] },
              { title: 'لیست', path: paths.dashboard.user.search, requiredPermissions: [PERM.ui.usersList] },
            ],
          },
          {
            title: 'نقش',
            path: paths.dashboard.role.create,
            icon: ICONS.role,
            anyPermissions: [PERM.ui.rolesList, PERM.ui.rolesCreate],
            children: [
              { title: 'جدید', path: paths.dashboard.role.create, requiredPermissions: [PERM.ui.rolesCreate] },
              { title: 'لیست', path: paths.dashboard.role.search, requiredPermissions: [PERM.ui.rolesList] },
            ],
          },
          {
            title: 'دسترسی',
            path: paths.dashboard.permission.create,
            icon: ICONS.permission,
            anyPermissions: [PERM.ui.permissionsList, PERM.ui.permissionsCreate],
            children: [
              { title: 'جدید', path: paths.dashboard.permission.create, requiredPermissions: [PERM.ui.permissionsCreate] },
              { title: 'لیست', path: paths.dashboard.permission.search, requiredPermissions: [PERM.ui.permissionsList] },
            ],
          },
          {
            title: 'انتساب نقش',
            path: paths.dashboard.delegation.search,
            icon: ICONS.role,
            requiredPermissions: [PERM.ui.roleDelegationManage],
            children: [
              { title: 'مدیریت delegation', path: paths.dashboard.delegation.search, requiredPermissions: [PERM.ui.roleDelegationManage] },
            ],
          },
          {
            title: 'لاگ ممیزی',
            path: paths.dashboard.audit.events,
            icon: ICONS.list,
            requiredPermissions: [PERM.ui.auditList],
          },
        ],
      },
      {
        title: 'مدیریت شعبات',
        path: paths.dashboard.branch.search,
        icon: ICONS.branch,
        anyPermissions: BRANCH_MANAGE_PERMISSIONS,
        children: [
          {
            title: 'شعبه جدید',
            path: paths.dashboard.branch.create,
            anyPermissions: [PERM.ui.branchCentralCreate, PERM.ui.branchTenantCreate],
          },
          {
            title: 'لیست شعبات',
            path: paths.dashboard.branch.search,
            anyPermissions: [PERM.ui.branchCentralList, PERM.ui.branchTenantList, PERM.ui.companyTenantManage],
          },
        ],
      },
      {
        title: 'یکپارچه‌سازی',
        path: paths.dashboard.admin.integration.connectors,
        icon: ICONS.list,
        centralAdminOnly: true,
        children: [
          {
            title: 'کانکتورها',
            path: paths.dashboard.admin.integration.connectors,
            centralAdminOnly: true,
          },
          {
            title: 'مانیتور اجرا',
            path: paths.dashboard.admin.integration.executions,
            centralAdminOnly: true,
          },
          {
            title: 'مدیریت DLQ',
            path: paths.dashboard.admin.integration.dlq,
            centralAdminOnly: true,
          },
          {
            title: 'Webhooks',
            path: paths.dashboard.admin.integration.webhooks,
            centralAdminOnly: true,
          },
          {
            title: 'Credential Refs',
            path: paths.dashboard.admin.integration.credentialRefs,
            centralAdminOnly: true,
          },
        ],
      },
      {
        title: 'خدمات',
        path: paths.dashboard.services.inbox,
        icon: ICONS.services,
        anyPermissions: [
          PERM.ui.servicesInbox,
          PERM.ui.servicesList,
          PERM.ui.servicesOne,
          PERM.ui.servicesTwo,
          PERM.ui.servicesThree,
        ],
        children: [
          {
            title: 'صندوق کار',
            path: paths.dashboard.services.inbox,
            requiredPermissions: [PERM.ui.servicesInbox],
          },
          {
            title: 'گزارش فرایندها',
            path: paths.dashboard.services.list,
            requiredPermissions: [PERM.ui.servicesList],
          },
          {
            title: 'خدمت شماره یک',
            path: paths.dashboard.services.one,
            icon: ICONS.serviceOne,
            requiredPermissions: [PERM.ui.servicesOne],
            children: [{ title: 'جدید', path: paths.dashboard.services.one, requiredPermissions: [PERM.ui.servicesOne] }],
          },
          {
            title: 'خدمت شماره دو',
            path: paths.dashboard.services.two,
            icon: ICONS.serviceTwo,
            requiredPermissions: [PERM.ui.servicesTwo],
            children: [{ title: 'جدید', path: paths.dashboard.services.two, requiredPermissions: [PERM.ui.servicesTwo] }],
          },
          {
            title: 'خدمت شماره سه',
            path: paths.dashboard.services.three,
            icon: ICONS.serviceThree,
            requiredPermissions: [PERM.ui.servicesThree],
            children: [{ title: 'جدید', path: paths.dashboard.services.three, requiredPermissions: [PERM.ui.servicesThree] }],
          },
        ],
      },
    ],
  },
];
