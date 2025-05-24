import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { ReservasModule } from './modules/reservas/reservas.module';
import { SociosModule } from './modules/socios/socios.module';
import { UserRole } from './modules/users/types/user-roles.enum';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/gestion-terranova'),
    UsersModule,
    AuthModule,
    InventoryModule,
    ReservasModule,
    SociosModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
