import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReservasController } from './controllers/reservas.controller';
import { ServiciosController } from './controllers/servicios.controller';
import { ReservasService } from './services/reservas.service';
import { ServiciosService } from './services/servicios.service';
import { Reserva, ReservaSchema } from './schemas/reserva.schema';
import { Servicio, ServicioSchema } from './schemas/servicio.schema';
import { Suplemento, SuplementoSchema } from './schemas/suplemento.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Reserva.name, schema: ReservaSchema },
            { name: Servicio.name, schema: ServicioSchema },
            { name: Suplemento.name, schema: SuplementoSchema }
        ])
    ],
    controllers: [ReservasController, ServiciosController],
    providers: [ReservasService, ServiciosService],
    exports: [ReservasService, ServiciosService]
})
export class ReservasModule { } 