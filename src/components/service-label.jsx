'use client';

import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import { getServiceLabel } from 'src/lib/service-labels';

const VARIANT_MAP = {
  default: 'body2',
  title: 'h5',
  card: 'subtitle1',
  table: 'caption',
  nav: 'body2',
  select: 'body2',
};

const VARIANT_SX = {
  default: {
    lineHeight: 1.55,
    wordBreak: 'break-word',
  },
  title: {
    lineHeight: 1.45,
    fontWeight: 700,
    wordBreak: 'break-word',
  },
  card: {
    lineHeight: 1.5,
    fontWeight: 700,
    wordBreak: 'break-word',
  },
  table: {
    lineHeight: 1.45,
    fontSize: '0.8125rem',
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    wordBreak: 'break-word',
  },
  nav: {
    lineHeight: 1.45,
    fontSize: '0.75rem',
    whiteSpace: 'normal',
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    wordBreak: 'break-word',
  },
  select: {
    lineHeight: 1.5,
    whiteSpace: 'normal',
    wordBreak: 'break-word',
  },
};

/**
 * نمایش یکنواخت عناوین طولانی خدمات در UI
 * @param {{ processKey?: string, label?: string, variant?: keyof VARIANT_MAP, component?: React.ElementType, sx?: object, tooltip?: boolean }} props
 */
export function ServiceLabel({
  processKey,
  label,
  variant = 'default',
  component,
  sx,
  tooltip = true,
  ...other
}) {
  const text = label ?? getServiceLabel(processKey);
  const typography = (
    <Typography
      component={component}
      variant={VARIANT_MAP[variant] ?? VARIANT_MAP.default}
      sx={{ ...VARIANT_SX[variant], ...sx }}
      {...other}
    >
      {text}
    </Typography>
  );

  if (!tooltip || !text || text.length < 28) {
    return typography;
  }

  return (
    <Tooltip title={text} placement="top-start" enterDelay={400}>
      <span>{typography}</span>
    </Tooltip>
  );
}
