import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReservasService } from './services/reservas.service';
import { ReservasController } from './controllers/reservas.controller';
import { Reserva, ReservaSchema } from './schemas/reserva.schema';
import { Servicio, ServicioSchema } from './schemas/servicio.schema';
import { Suplemento, SuplementoSchema } from './schemas/suplemento.schema';
import { ServiciosService } from './services/servicios.service';
import { ServiciosController } from './controllers/servicios.controller';

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