import { varAlpha } from 'minimal-shared/utils';

export const dashboardPageSx = {
  minHeight: '100%',
  p: { xs: 2, md: 3 },
  bgcolor: (theme) =>
    theme.palette.mode === 'light'
      ? varAlpha(theme.vars.palette.grey['500Channel'], 0.04)
      : theme.vars.palette.background.default,
};

export const dashboardCardSx = {
  borderRadius: 2.5,
  border: '1px solid',
  borderColor: 'divider',
  boxShadow: (theme) => `0 1px 2px ${varAlpha(theme.vars.palette.grey['500Channel'], 0.08)}`,
  transition: (theme) =>
    theme.transitions.create(['box-shadow', 'border-color', 'transform'], {
      duration: theme.transitions.duration.shorter,
    }),
  '&:hover': {
    borderColor: (theme) => varAlpha(theme.vars.palette.primary.mainChannel, 0.24),
    boxShadow: (theme) => `0 8px 24px ${varAlpha(theme.vars.palette.grey['500Channel'], 0.12)}`,
  },
};

export const dashboardCardStaticSx = {
  borderRadius: 2.5,
  border: '1px solid',
  borderColor: 'divider',
  boxShadow: (theme) => `0 1px 2px ${varAlpha(theme.vars.palette.grey['500Channel'], 0.08)}`,
};

export const dashboardSectionTitleSx = {
  fontWeight: 700,
  letterSpacing: '-0.01em',
};
