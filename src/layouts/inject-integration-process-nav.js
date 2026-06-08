import { paths } from 'src/routes/paths';

/**
 * جایگزینی آیتم‌های Process Binding ثابت با لیست پویای فرایندها از API.
 * @param {typeof import('./nav-config-dashboard').navData} navData
 * @param {Array<{ key: string, name?: string }>} processDefinitions
 */
export function injectIntegrationProcessNav(navData, processDefinitions) {
  if (!Array.isArray(navData)) {
    return navData;
  }

  const defs = Array.isArray(processDefinitions) ? processDefinitions : [];
  const integrationPath = paths.dashboard.admin.integration.connectors;

  return navData.map((section) => ({
    ...section,
    items: (section.items ?? []).map((item) => {
      if (item.path !== integrationPath) {
        return item;
      }

      const staticChildren = (item.children ?? []).filter((child) => !child.dynamicProcessBinding);
      const dynamicChildren = defs.map((def) => ({
        title: `Process Binding (${def.key})`,
        path: paths.dashboard.admin.integration.processIntegrations(def.key),
        centralAdminOnly: true,
        dynamicProcessBinding: true,
      }));

      return {
        ...item,
        children: [...staticChildren, ...dynamicChildren],
      };
    }),
  }));
}
