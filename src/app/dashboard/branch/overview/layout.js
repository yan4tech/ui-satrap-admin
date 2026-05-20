import { CONFIG } from 'src/global-config';

export const metadata = { title: `داشبورد شعبه - ${CONFIG.appName}` };

export default function Layout({ children }) {
  return children;
}
