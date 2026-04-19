import { isActiveLink } from 'minimal-shared/utils';

/**
 * True if this nav item's path matches the URL, or any nested child does.
 * Needed when a parent path is not a prefix of all descendant routes.
 */
export function isNavItemOrDescendantActive(pathname, data) {
  if (!data?.path) {
    return false;
  }
  const deep = data.deepMatch ?? !!data.children;
  if (isActiveLink(pathname, data.path, deep)) {
    return true;
  }
  if (!data.children?.length) {
    return false;
  }
  return data.children.some((child) => isNavItemOrDescendantActive(pathname, child));
}
