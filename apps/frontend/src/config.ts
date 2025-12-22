import { readFileSync } from "fs";
import { resolve } from "path";

export interface FrontendConfig {
  server: {
    port: number;
    host: string;
  };
  api: {
    baseUrl: string;
    proxyEnabled: boolean;
  };
  vite: {
    baseUrl: string;
  };
}

/**
 * Load frontend configuration based on NODE_ENV
 * Used at build time and dev time by vite.config.ts
 */
export function loadFrontendConfig(): FrontendConfig {
  const env = process.env.NODE_ENV || "development";
  const configDir = resolve(__dirname, "../config");

  // Load default config first
  const defaultConfig: FrontendConfig = JSON.parse(
    readFileSync(resolve(configDir, "default.json"), "utf-8"),
  );

  // Try to load environment-specific config
  let envConfig: Partial<FrontendConfig> = {};
  try {
    const envConfigPath = resolve(configDir, `${env}.json`);
    envConfig = JSON.parse(readFileSync(envConfigPath, "utf-8"));
  } catch {
    console.warn(`No config file for environment: ${env}, using default`);
  }

  // Merge configs (env overrides default)
  const config: FrontendConfig = {
    server: { ...defaultConfig.server, ...envConfig.server },
    api: { ...defaultConfig.api, ...envConfig.api },
    vite: { ...defaultConfig.vite, ...envConfig.vite },
  };

  console.log(`[FrontendConfig] Loaded config for environment: ${env}`);
  console.log(`[FrontendConfig] API Base URL: ${config.api.baseUrl}`);
  console.log(`[FrontendConfig] Server Port: ${config.server.port}`);

  return config;
}
