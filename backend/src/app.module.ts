import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { SociosModule } from './modules/socios/socios.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { VentasModule } from './modules/ventas/ventas.module';
import { ReservasModule } from './modules/reservas/reservas.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { InvitacionesModule } from './modules/invitaciones/invitaciones.module';
import { UserRole } from './modules/users/types/user-roles.enum';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/gestion-terranova'),
    AuthModule,
    UsersModule,
    SociosModule,
    InventoryModule,
    VentasModule,
    ReservasModule,
    UploadsModule,
    InvitacionesModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
