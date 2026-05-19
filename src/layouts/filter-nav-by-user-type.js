/**
 * Filters dashboard nav items by authenticated user_type.
 * @param {typeof import('./nav-config-dashboard').navData} navData
 * @param {string} userType
 */
export function filterNavByUserType(navData, userType) {
  const type = String(userType ?? '').trim();
  if (!type || !Array.isArray(navData)) {
    return navData;
  }

  const filterItems = (items) =>
    (items || [])
      .map((item) => {
        if (item.allowedUserTypes?.length && !item.allowedUserTypes.includes(type)) {
          return null;
        }
        if (item.deniedUserTypes?.length && item.deniedUserTypes.includes(type)) {
          return null;
        }
        if (item.children?.length) {
          const children = filterItems(item.children);
          if (children.length === 0) {
            return null;
          }
          return { ...item, children };
        }
        return item;
      })
      .filter(Boolean);

  return navData
    .map((section) => {
      const items = filterItems(section.items);
      if (!items.length) {
        return null;
      }
      return { ...section, items };
    })
    .filter(Boolean);
}
