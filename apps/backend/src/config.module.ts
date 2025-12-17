import { Module } from "@nestjs/common";
import { loadConfig, getConfig } from "./config.js";

// Load and validate configuration when module is imported
loadConfig();

@Module({
  providers: [
    {
      provide: "APP_CONFIG",
      useValue: getConfig(),
    },
  ],
  exports: ["APP_CONFIG"],
})
export class ConfigModule {}
