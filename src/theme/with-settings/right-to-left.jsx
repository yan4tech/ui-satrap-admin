import { useEffect } from 'react';

// ----------------------------------------------------------------------

export function Rtl({ children, direction }) {
  useEffect(() => {
    document.dir = direction;
  }, [direction]);

  return <>{children}</>;
}
