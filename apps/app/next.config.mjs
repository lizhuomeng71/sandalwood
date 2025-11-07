import "./src/env.mjs";
import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@v1/supabase"],
  experimental: {
    instrumentationHook: process.env.NODE_ENV === "production",
  },
  // Performance optimizations for development
  ...(process.env.NODE_ENV === "development" && {
    webpack: (config, { isServer }) => {
      // Optimize webpack for faster rebuilds
      config.watchOptions = {
        ...config.watchOptions,
        poll: false, // Disable polling, use native file watching
        ignored: /node_modules/,
      };

      // Speed up incremental builds
      if (!isServer) {
        config.optimization = {
          ...config.optimization,
          moduleIds: 'deterministic',
        };
      }

      return config;
    },
  }),
};

// Only apply Sentry in production to avoid development overhead
const exportConfig = process.env.NODE_ENV === "production"
  ? withSentryConfig(nextConfig, {
      silent: !process.env.CI,
      telemetry: false,
      widenClientFileUpload: true,
      hideSourceMaps: true,
      disableLogger: true,
      tunnelRoute: "/monitoring",
    })
  : nextConfig;

export default exportConfig;
