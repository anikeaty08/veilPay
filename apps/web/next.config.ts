import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    webpackBuildWorker: false,
  },
  turbopack: {
    // Vercel sets `outputFileTracingRoot` to the repo root (e.g. `/vercel/path0`).
    // Keep Turbopack aligned so builds don't loop on the mismatch warning.
    root: path.resolve(__dirname, "../.."),
  },
  webpack: (config, { isServer }) => {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
      topLevelAwait: true,
    };

    config.optimization.moduleIds = "named";
    config.module.rules.push({
      test: /\.wasm$/,
      type: "asset/resource",
    });

    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      net: false,
      tls: false,
      child_process: false,
      "@react-native-async-storage/async-storage": false,
    };

    config.externals = [
      ...(config.externals || []),
      "@metamask/sdk",
    ];

    if (isServer) {
      config.output.webassemblyModuleFilename = "./../static/wasm/[modulehash].wasm";
    } else {
      config.output.webassemblyModuleFilename = "static/wasm/[modulehash].wasm";
    }

    return config;
  },
};

export default nextConfig;
