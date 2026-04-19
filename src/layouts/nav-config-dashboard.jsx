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
};

// ----------------------------------------------------------------------

export const navData = [
  /**
   * Overview
   */
  {
    subheader: 'Overview',
    items: [
      {
        title: 'One',
        path: paths.dashboard.root,
        icon: ICONS.dashboard,
        info: <Label>v{CONFIG.appVersion}</Label>,
      },
      { title: 'Two', path: paths.dashboard.two, icon: ICONS.ecommerce },
      { title: 'Three', path: paths.dashboard.three, icon: ICONS.analytics },
    ],
  },
  /**
   * Management
   */
  {
    subheader: 'مدیریت',
    items: [
      // {
      //   title: 'Group',
      //   path: paths.dashboard.group.root,
      //   icon: ICONS.user,
      //   children: [
      //     { title: 'Four', path: paths.dashboard.group.root },
      //     { title: 'Five', path: paths.dashboard.group.five },
      //     { title: 'Six', path: paths.dashboard.group.six },
      //   ],
      // },
      {
        title: 'شعبه',
        path: paths.dashboard.branch.create,
        icon: ICONS.branch,
        children: [
          { title: 'شعبه جدید', path: paths.dashboard.branch.create },
          { title: 'لیست شعبات', path: paths.dashboard.branch.search },
        ],
      },
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
];
