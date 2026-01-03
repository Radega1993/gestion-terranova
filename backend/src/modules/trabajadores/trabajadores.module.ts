import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TrabajadoresController } from './controllers/trabajadores.controller';
import { TrabajadoresService } from './services/trabajadores.service';
import { Trabajador, TrabajadorSchema } from '../users/schemas/trabajador.schema';
import { Tienda, TiendaSchema } from '../tiendas/schemas/tienda.schema';
import { TiendasModule } from '../tiendas/tiendas.module';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Trabajador.name, schema: TrabajadorSchema },
            { name: Tienda.name, schema: TiendaSchema }
        ]),
        TiendasModule,
        UsersModule
    ],
    controllers: [TrabajadoresController],
    providers: [TrabajadoresService],
    exports: [TrabajadoresService]
})
export class TrabajadoresModule { }

