import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ensureAdmin } from './scripts/ensure-admin';
import { Logger } from '@nestjs/common';
import { Connection } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';

async function dropEmailIndex(connection: Connection) {
  const logger = new Logger('DropEmailIndex');
  try {
    logger.log('Verificando si existe índice email_1 en la colección users...');
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
      logger.log(`Encontrados ${emailIndexes.length} índices relacionados con email. Eliminando...`);
      for (const index of emailIndexes) {
        if (index.name) {
          logger.log(`Eliminando índice ${index.name}...`);
          await collection.dropIndex(index.name);
          logger.log(`Índice ${index.name} eliminado correctamente.`);
        }
      }
    } else {
      logger.log('No se encontraron índices relacionados con el campo email.');
    }
  } catch (error) {
    logger.error(`Error al eliminar índice email: ${error.message}`);
  }
}

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Configurar el prefijo global para todas las rutas
  app.setGlobalPrefix('api');

  // Habilitar CORS
  app.enableCors();

  // Configurar validación global
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  // Obtener la conexión a MongoDB
  const connection = app.get(getConnectionToken());

  // Eliminar cualquier índice relacionado con email
  await dropEmailIndex(connection);

  // Verificar/crear usuario administrador
  await ensureAdmin();

  // Log de las rutas registradas
  const server = app.getHttpServer();
  const router = server._events.request._router;
  const availableRoutes = router.stack
    .map(layer => {
      if (layer.route) {
        const path = layer.route?.path;
        const method = Object.keys(layer.route.methods)[0].toUpperCase();
        return `${method} ${path}`;
      }
    })
    .filter(item => item !== undefined);

  logger.log('=== RUTAS REGISTRADAS ===');
  availableRoutes.forEach(route => logger.log(route));
  logger.log('========================');

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
