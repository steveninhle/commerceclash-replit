import { NestFactory } from '@nestjs/core';
import { allowedOrigins } from './utils/config/allowed-origins';
import { AppModule } from './app.module';
import { winstonLoggerConfig } from './utils/logger/winston-logger.config';
import { WinstonModule } from 'nest-winston';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
// import * as fs from 'fs';
// import * as path from 'path';

async function bootstrap() {
  // const httpsOptions = {
  //   key: fs.readFileSync(path.join(__dirname, '..', 'certs', 'backend-key.pem')),
  //   cert: fs.readFileSync(path.join(__dirname, '..', 'certs', 'backend-cert.pem')),
  // };
  const app = await NestFactory.create(AppModule, {
    //httpsOptions,
    logger: WinstonModule.createLogger(winstonLoggerConfig),
    rawBody: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.use(cookieParser());
  const config = new DocumentBuilder()
    .setTitle('Commerce Clash - ZoomApp')
    .setDescription('Commerce Clash ZoomApp Api Documentation')
    .setVersion('1.0')
    .addCookieAuth('access_token')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Access', 'Idempotency-Key'],
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 4000);
}
bootstrap().catch((error) => {
  console.error('Failed to start the application:', error);
});
