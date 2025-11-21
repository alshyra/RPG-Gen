import 'reflect-metadata';
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, INestApplication } from '@nestjs/common';
import { AppModule } from './app.module.js';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';

// Validate required environment variables
const validateEnv = (app: INestApplication) => {
  const logger = app.get(Logger);
  const required = ['GOOGLE_API_KEY', 'GOOGLE_OAUTH_CLIENT_ID', 'GOOGLE_OAUTH_CLIENT_SECRET'];
  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  logger.log('All required environment variables are set Nest is ready to start.');
};

const setupCors = (app: INestApplication) => {
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:80',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
};

// PinoLogger handles both JSON and pretty-print based on LOG_FORMAT env
const setupLogging = (app: INestApplication) => app.useLogger(app.get(Logger));

const setupSwagger = (app: INestApplication) => {
  const config = new DocumentBuilder()
    .setTitle('RPG Gemini Portal')
    .setDescription('Prototype API for RPG portal using Gemini tokens')
    .setVersion('0.1')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);
};

const logApplicationStartup = async (app: INestApplication, port: number) => {
  const logger = app.get(Logger);
  const url = await app.getUrl();
  const fullPath = `${url}:${port}`;
  logger.debug(`Backend started and listen at ${fullPath}`);
  logger.debug(`📚 Swagger docs available at: http://${fullPath}/docs`);
};

const bootstrap = async () => {
  const app = await NestFactory.create(AppModule, { bufferLogs: true, logger: false });
  app.setGlobalPrefix('api');
  setupCors(app);
  setupLogging(app);
  validateEnv(app);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: false }));
  setupSwagger(app);
  const port = process.env.SERVER_PORT ? parseInt(process.env.SERVER_PORT, 10) : 3001;
  await app.listen(port, '0.0.0.0');
  await logApplicationStartup(app, port);
};
bootstrap();
