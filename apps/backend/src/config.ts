import config from "config";
import Joi from "joi";
import { Logger } from "@nestjs/common";

export interface AppConfig {
  port: number;
  mongodb: {
    uri: string;
  };
  google: {
    apiKey: string;
    oauth: {
      clientId: string;
      clientSecret: string;
      callbackUrl: string;
    };
  };
  frontend: {
    url: string;
  };
  features: {
    e2eMode: boolean;
  };
}

const configSchema = Joi.object<AppConfig>({
  port: Joi.number().port().default(3001),
  mongodb: Joi.object({
    uri: Joi.string().required(),
  }).required(),
  google: Joi.object({
    apiKey: Joi.string().required(),
    oauth: Joi.object({
      clientId: Joi.string().required(),
      clientSecret: Joi.string().required(),
      callbackUrl: Joi.string().uri().required(),
    }).required(),
  }).required(),
  frontend: Joi.object({
    url: Joi.string().uri().required(),
  }).required(),
  features: Joi.object({
    e2eMode: Joi.boolean().default(false),
  }).default({}),
});

let appConfig: AppConfig;

export function loadConfig(): AppConfig {
  try {
    let rawConfig = config.util.toObject() as AppConfig;

    // Override with environment variables
    rawConfig = {
      ...rawConfig,
      google: {
        ...rawConfig.google,
        apiKey: process.env.GOOGLE_API_KEY || rawConfig.google.apiKey,
        oauth: {
          ...rawConfig.google.oauth,
          clientId: process.env.GOOGLE_OAUTH_CLIENT_ID || rawConfig.google.oauth.clientId,
          clientSecret:
            process.env.GOOGLE_OAUTH_CLIENT_SECRET || rawConfig.google.oauth.clientSecret,
        },
      },
      features: {
        e2eMode: process.env.DISABLE_AUTH_FOR_E2E === "true",
      },
    };

    const { error, value } = configSchema.validate(rawConfig, {
      abortEarly: false,
      allowUnknown: true,
    });

    if (error) {
      const logger = new Logger("ConfigLoader");
      logger.error(`Configuration validation failed: ${error.message}`);
      throw new Error(`Invalid configuration: ${error.message}`);
    }

    appConfig = value;

    const logger = new Logger("ConfigLoader");
    logger.log(`Configuration loaded for environment: ${process.env.NODE_ENV || "development"}`);
    logger.debug(`MongoDB URI: ${appConfig.mongodb.uri.replace(/:[^:/@]*@/, ":***@")}`);
    logger.debug(`Frontend URL: ${appConfig.frontend.url}`);
    logger.debug(`E2E Mode: ${appConfig.features.e2eMode}`);

    return appConfig;
  } catch (error) {
    const logger = new Logger("ConfigLoader");
    logger.error(
      `Failed to load configuration: ${error instanceof Error ? error.message : String(error)}`,
    );
    throw error;
  }
}

export function getConfig(): AppConfig {
  if (!appConfig) {
    throw new Error("Configuration not initialized. Call loadConfig() first.");
  }
  return appConfig;
}
