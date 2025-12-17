import "./env-loader.js";
import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe, INestApplication, ConsoleLogger, Logger } from "@nestjs/common";
import { AppModule } from "./app.module.js";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { seedAllData } from "./seed-manager.js";
import { getConfig } from "./config.js";

const setupCors = (app: INestApplication, appConfig: ReturnType<typeof getConfig>) => {
  app.enableCors({
    origin: appConfig.frontend.url,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });
};

const setupSwagger = (app: INestApplication) => {
  const config = new DocumentBuilder()
    .setTitle("RPG Gen Portal")
    .setDescription("Prototype API for RPG portal using Gemini tokens")
    .setVersion("0.1")
    .addBearerAuth()
    .build();
  SwaggerModule.setup("docs", app, SwaggerModule.createDocument(app, config));
};

const bootstrap = async () => {
  const app = await NestFactory.create(AppModule, {
    logger: new ConsoleLogger({
      logLevels: ["log", "error", "warn", "debug", "verbose"],
      colors: true,
      json: true,
    }),
  });
  app.setGlobalPrefix("api");

  // Config is now loaded via ConfigModule
  const appConfig = getConfig();
  setupCors(app, appConfig);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
    }),
  );
  setupSwagger(app);

  const logger = new Logger("Bootstrap");
  await app.listen(appConfig.port, "0.0.0.0");
  await seedAllData(app, logger);
  const url = await app.getUrl();
  logger.log(`Backend started and listen at ${url}`);
  logger.log(`📚 Swagger docs available at: ${url}/docs`);
};

await bootstrap();
