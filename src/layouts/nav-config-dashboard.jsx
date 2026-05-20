import { paths } from 'src/routes/paths';

import { CONFIG } from 'src/global-config';
import { PERM } from 'src/lib/permissions';
import {
  BRANCH_DASHBOARD_NAV_PERMISSIONS,
  COMPANY_DASHBOARD_NAV_PERMISSIONS,
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

// ----------------------------------------------------------------------

export const navData = [
  {
    subheader: 'داشبورد',
    items: [
      {
        title: 'داشبورد سازمان مرکزی',
        path: paths.dashboard.root,
        icon: ICONS.dashboard,
        requiredPermissions: [PERM.ui.dashboardView],
      },
      {
        title: 'داشبورد شرکت',
        path: paths.dashboard.company.overview,
        icon: ICONS.banking,
        anyPermissions: COMPANY_DASHBOARD_NAV_PERMISSIONS,
      },
      {
        title: 'داشبورد شعبه',
        path: paths.dashboard.branch.overview,
        icon: ICONS.branch,
        anyPermissions: BRANCH_DASHBOARD_NAV_PERMISSIONS,
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
        ],
      },
      {
        title: 'مدیریت شرکت',
        path: paths.dashboard.company.manage,
        icon: ICONS.banking,
        requiredPermissions: [PERM.ui.companyTenantManage],
      },
      {
        title: 'شعب شرکت',
        path: paths.dashboard.branch.search,
        icon: ICONS.branch,
        anyPermissions: [PERM.ui.branchTenantList, PERM.ui.branchTenantCreate],
        children: [
          { title: 'شعبه جدید', path: paths.dashboard.branch.create, requiredPermissions: [PERM.ui.branchTenantCreate] },
          { title: 'لیست شعبات', path: paths.dashboard.branch.search, requiredPermissions: [PERM.ui.branchTenantList] },
        ],
      },
      {
        title: 'مدیریت شرکت‌ها',
        path: paths.dashboard.company.create,
        icon: ICONS.banking,
        anyPermissions: [PERM.ui.companyCentralList, PERM.ui.companyCentralCreate],
        children: [
          { title: 'شرکت جدید', path: paths.dashboard.company.create, requiredPermissions: [PERM.ui.companyCentralCreate] },
          { title: 'لیست شرکت‌ها', path: paths.dashboard.company.search, requiredPermissions: [PERM.ui.companyCentralList] },
        ],
      },
      {
        title: 'مدیریت شعبات',
        path: paths.dashboard.branch.create,
        icon: ICONS.branch,
        anyPermissions: [PERM.ui.branchCentralList, PERM.ui.branchCentralCreate],
        children: [
          { title: 'شعبه جدید', path: paths.dashboard.branch.create, requiredPermissions: [PERM.ui.branchCentralCreate] },
          { title: 'لیست شعبات', path: paths.dashboard.branch.search, requiredPermissions: [PERM.ui.branchCentralList] },
        ],
      },
      {
        title: 'خدمات',
        path: paths.dashboard.services.list,
        icon: ICONS.services,
        anyPermissions: [
          PERM.ui.servicesList,
          PERM.ui.servicesOne,
          PERM.ui.servicesTwo,
          PERM.ui.servicesThree,
        ],
        children: [
          { title: 'لیست', path: paths.dashboard.services.list, requiredPermissions: [PERM.ui.servicesList] },
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
