import 'reflect-metadata';
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, INestApplication, ConsoleLogger, Logger } from '@nestjs/common';
import { AppModule } from './app.module.js';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { seedAllData } from './seed-manager.js';

const validateEnv = () => {
  const required = ['GOOGLE_API_KEY', 'GOOGLE_OAUTH_CLIENT_ID', 'GOOGLE_OAUTH_CLIENT_SECRET'];
  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  new Logger('Bootstrap').log(
    'All required environment variables are set. Nest is ready to start.',
  );
};

const setupCors = (app: INestApplication) => {
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
};

const setupSwagger = (app: INestApplication) => {
  const config = new DocumentBuilder()
    .setTitle('RPG Gen Portal')
    .setDescription('Prototype API for RPG portal using Gemini tokens')
    .setVersion('0.1')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config));
};

const bootstrap = async () => {
  const app = await NestFactory.create(AppModule, {
    logger: new ConsoleLogger({
      logLevels: ['log', 'error', 'warn', 'debug', 'verbose'],
      colors: true,
      json: true,
    }),
  });
  app.setGlobalPrefix('api');
  setupCors(app);
  validateEnv();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
    }),
  );
  setupSwagger(app);

  const logger = new Logger('Bootstrap');
  const port = process.env.SERVER_PORT ? parseInt(process.env.SERVER_PORT, 10) : 3001;
  await app.listen(port, '0.0.0.0');
  await seedAllData(app, logger);
  const url = await app.getUrl();
  logger.log(`Backend started and listen at ${url}`);
  logger.log(`📚 Swagger docs available at: ${url}/docs`);
};

bootstrap();
