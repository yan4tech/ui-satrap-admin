/**
 * Static Exports in Next.js
 *
 * 1. Set `isStaticExport = true` in `next.config.{mjs|ts}`.
 * 2. This allows `generateStaticParams()` to pre-render dynamic routes at build time.
 *
 * For more details, see:
 * https://nextjs.org/docs/app/building-your-application/deploying/static-exports
 *
 * NOTE: Remove all "generateStaticParams()" functions if not using static exports.
 */
const isStaticExport = false;

// ----------------------------------------------------------------------

const nextConfig = {
  // Static export only; dev/release pages work without forced trailing slashes on /api/*
  trailingSlash: false,
  skipTrailingSlashRedirect: true,
  output: isStaticExport ? 'export' : undefined,
  env: {
    BUILD_STATIC_EXPORT: JSON.stringify(isStaticExport),
  },
  async rewrites() {
    return [
      { source: '/api/membership/:path*', destination: 'http://127.0.0.1:2020/api/membership/:path*' },
      { source: '/api/payment/:path*', destination: 'http://127.0.0.1:2022/api/payment/:path*' },
      { source: '/api/engine/:path*', destination: 'http://127.0.0.1:3503/api/engine/:path*' },
      { source: '/api/integration/:path*', destination: 'http://127.0.0.1:3505/api/integration/:path*' },
      { source: '/api/gateway/:path*', destination: 'http://127.0.0.1:3505/:path*' },
      { source: '/api/pos-agent/:path*', destination: 'http://127.0.0.1:18800/:path*' },
      { source: '/v1/pos/:path*', destination: 'http://127.0.0.1:18800/v1/pos/:path*' },
    ];
  },
  // Without --turbopack (next dev)
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });

    return config;
  },
  // With --turbopack (next dev --turbopack)
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
};

export default nextConfig;
