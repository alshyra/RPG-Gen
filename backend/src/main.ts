import "reflect-metadata";
import "dotenv/config";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe, Logger, INestApplication } from "@nestjs/common";
import { AppModule } from "./app.module";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

// Validate required environment variables
const validateEnv = () => {
  const required = ["GOOGLE_API_KEY", "GOOGLE_OAUTH_CLIENT_ID", "GOOGLE_OAUTH_CLIENT_SECRET"];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
  console.log("All required environment variables are set.");
};

function setupCors(app: INestApplication) {
  app.enableCors({
    origin: process.env.FRONTEND_URL || "http://localhost:80",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });
}

function setupLogging(app: INestApplication) {
  const logger = new Logger("Bootstrap");
  app.use((req, res, next) => {
    logger.log(`${req.method} ${req.path}`, "HTTP");
    next();
  });
  return logger;
}

function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle("RPG Gemini Portal")
    .setDescription("Prototype API for RPG portal using Gemini tokens")
    .setVersion("0.1")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("docs", app, document);
}

const logStart = async (logger, app) => {
  logger.debug("Backend listening on", await app.getUrl());
  logger.debug("📚 Swagger docs available at: http://localhost:3001/docs");
};

async function bootstrap() {
  validateEnv();
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("api");
  setupCors(app);
  const logger = setupLogging(app);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: false }));
  setupSwagger(app);
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
  await app.listen(port, "0.0.0.0");
  logStart(logger, app);
}
bootstrap();
