import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { Connection } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';
import { json } from 'express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as express from 'express';

async function dropEmailIndex(connection: Connection) {
  const logger = new Logger('DropEmailIndex');
  try {
    const db = connection.db;

    if (!db) {
      logger.error('No se pudo acceder a la base de datos');
      return;
    }

    const collection = db.collection('users');

    const indexes = await collection.indexes();

    // Buscar índices que puedan contener el campo email
    const emailIndexes = indexes.filter(index => index.key && index.key.email);

    if (emailIndexes.length > 0) {
      for (const index of emailIndexes) {
        if (index.name) {
          await collection.dropIndex(index.name);
        }
      }
    } else {
    }
  } catch (error) {
    logger.error(`Error al eliminar índice email: ${error.message}`);
  }
}

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Configurar límite de tamaño para peticiones
  app.use(json({ limit: '50mb' }));

  // Configurar CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  });

  // Configurar validación global
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  // Configurar prefijo global
  app.setGlobalPrefix('api');

  // Obtener la conexión a MongoDB
  const connection = app.get(getConnectionToken());

  // Eliminar cualquier índice relacionado con email
  await dropEmailIndex(connection);

  // Configurar Swagger
  const config = new DocumentBuilder()
    .setTitle('Gestión Terranova API')
    .setDescription('API para la gestión de la asociación de vecinos')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Configurar archivos estáticos
  const uploadsPath = join(process.cwd(), 'uploads');

  // Configurar archivos estáticos sin el prefijo /api
  app.use('/uploads', express.static(uploadsPath, {
    setHeaders: (res) => {
      res.set('Cross-Origin-Resource-Policy', 'cross-origin');
      res.set('Access-Control-Allow-Origin', '*');
      res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.set('Cache-Control', 'public, max-age=31536000');
    },
  }));

  // Configurar directorio de uploads como estático
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
}
bootstrap();
