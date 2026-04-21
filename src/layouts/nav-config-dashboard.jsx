import { paths } from 'src/routes/paths';

import { CONFIG } from 'src/global-config';

import { Label } from 'src/components/label';
import { SvgColor } from 'src/components/svg-color';

// ----------------------------------------------------------------------

const icon = (name) => <SvgColor src={`${CONFIG.assetsDir}/assets/icons/navbar/${name}.svg`} />;

const ICONS = {
  job: icon('ic-job'),
  blog: icon('ic-blog'),
  chat: icon('ic-chat'),
  mail: icon('ic-mail'),
  user: icon('ic-user'),
  file: icon('ic-file'),
  lock: icon('ic-lock'),
  tour: icon('ic-tour'),
  order: icon('ic-order'),
  label: icon('ic-label'),
  blank: icon('ic-blank'),
  kanban: icon('ic-kanban'),
  folder: icon('ic-folder'),
  course: icon('ic-course'),
  params: icon('ic-params'),
  banking: icon('ic-banking'),
  booking: icon('ic-booking'),
  invoice: icon('ic-invoice'),
  product: icon('ic-product'),
  calendar: icon('ic-calendar'),
  disabled: icon('ic-disabled'),
  external: icon('ic-external'),
  subpaths: icon('ic-subpaths'),
  menuItem: icon('ic-menu-item'),
  ecommerce: icon('ic-ecommerce'),
  analytics: icon('ic-analytics'),
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
};

// ----------------------------------------------------------------------

export const navData = [
  /**
   * Dashboard
   */
  {
    subheader: 'داشبورد',
    items: [
      { title: 'داشبورد', path: paths.dashboard.root, icon: ICONS.dashboard },
    ],
  },
  /**
   * Overview
   */
  // {
  //   subheader: 'Overview',
  //   items: [
  //     {
  //       title: 'One',
  //       path: paths.dashboard.root,
  //       icon: ICONS.dashboard,
  //       info: <Label>v{CONFIG.appVersion}</Label>,
  //     },
  //     { title: 'Two', path: paths.dashboard.two, icon: ICONS.ecommerce },
  //   ],
  // },
  /**
   * Management
   */
  {
    subheader: 'مدیریت',
    items: [
      {
        title: 'مدیریت کاربران',
        path: paths.dashboard.user.search,
        icon: ICONS.userMgmt,
        children: [
          {
            title: 'نقش',
            path: paths.dashboard.role.create,
            icon: ICONS.role,
            children: [
              { title: 'جدید', path: paths.dashboard.role.create },
              { title: 'لیست', path: paths.dashboard.role.search },
            ],
          },
          {
            title: 'دسترسی',
            path: paths.dashboard.permission.create,
            icon: ICONS.permission,
            children: [
              { title: 'جدید', path: paths.dashboard.permission.create },
              { title: 'لیست', path: paths.dashboard.permission.search },
            ],
          },
          {
            title: 'کاربر',
            path: paths.dashboard.user.create,
            icon: ICONS.userMgmt,
            children: [
              { title: 'جدید', path: paths.dashboard.user.create },
              { title: 'لیست', path: paths.dashboard.user.search },
            ],
          },
        ],
      },
      {
        title: 'مدیریت شعبات',
        path: paths.dashboard.branch.create,
        icon: ICONS.branch,
        children: [
          { title: 'شعبه جدید', path: paths.dashboard.branch.create, icon: ICONS.create },
          { title: 'لیست شعبات', path: paths.dashboard.branch.search, icon: ICONS.list },
        ],
      },
      {
        title: 'خدمات',
        path: paths.dashboard.services.list,
        icon: ICONS.services,
        children: [
          { title: 'لیست', path: paths.dashboard.services.list, icon: ICONS.list },
          {
            title: 'خدمت شماره یک',
            path: paths.dashboard.services.one,
            icon: ICONS.serviceOne,
            children: [{ title: 'جدید', path: paths.dashboard.services.one, icon: ICONS.create }],
          },
          {
            title: 'خدمت شماره دو',
            path: paths.dashboard.services.two,
            icon: ICONS.serviceTwo,
            children: [{ title: 'جدید', path: paths.dashboard.services.two, icon: ICONS.create }],
          },
          {
            title: 'خدمت شماره سه',
            path: paths.dashboard.services.three,
            icon: ICONS.serviceThree,
            children: [{ title: 'جدید', path: paths.dashboard.services.three, icon: ICONS.create }],
          },
        ],
      },
    ],
  },
];
