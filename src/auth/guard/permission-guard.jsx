'use client';

import { m } from 'framer-motion';

import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { ForbiddenIllustration } from 'src/assets/illustrations';

import { varBounce, MotionContainer } from 'src/components/animate';

import { userHasAllPermissions, userHasAnyPermission } from 'src/lib/permissions';

import { useAuthContext } from '../hooks';

// ----------------------------------------------------------------------

/**
 * Renders children only when the user has required permission slugs.
 */
export function PermissionGuard({
  sx,
  children,
  hasContent = true,
  requiredPermissions,
  anyPermissions,
}) {
  const { user } = useAuthContext();

  const allowed =
    (requiredPermissions?.length ? userHasAllPermissions(user, requiredPermissions) : true) &&
    (anyPermissions?.length ? userHasAnyPermission(user, anyPermissions) : true);

  if (!allowed) {
    return hasContent ? (
      <Container
        component={MotionContainer}
        sx={[{ textAlign: 'center' }, ...(Array.isArray(sx) ? sx : [sx])]}
      >
        <m.div variants={varBounce('in')}>
          <Typography variant="h3" sx={{ mb: 2 }}>
            دسترسی غیرمجاز
          </Typography>
        </m.div>

        <m.div variants={varBounce('in')}>
          <Typography sx={{ color: 'text.secondary' }}>
            شما مجوز دسترسی به این بخش را ندارید.
          </Typography>
        </m.div>

        <m.div variants={varBounce('in')}>
          <ForbiddenIllustration sx={{ my: { xs: 5, sm: 10 } }} />
        </m.div>
      </Container>
    ) : null;
  }

  return children;
}
