import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReservasController } from './controllers/reservas.controller';
import { ServiciosController } from './servicios.controller';
import { ReservasService } from './services/reservas.service';
import { ServiciosService } from './servicios.service';
import { Reserva, ReservaSchema } from './schemas/reserva.schema';
import { Suplemento, SuplementoSchema } from './schemas/suplemento.schema';
import { Servicio, ServicioSchema } from './schemas/servicio.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Reserva.name, schema: ReservaSchema },
            { name: Suplemento.name, schema: SuplementoSchema },
            { name: Servicio.name, schema: ServicioSchema }
        ])
    ],
    controllers: [ReservasController, ServiciosController],
    providers: [ReservasService, ServiciosService],
    exports: [ReservasService, ServiciosService]
})
export class ReservasModule { } 