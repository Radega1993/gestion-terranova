import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VentasController } from './controllers/ventas.controller';
import { VentasService } from './services/ventas.service';
import { Venta, VentaSchema } from './schemas/venta.schema';
import { Product, ProductSchema } from '../inventory/schemas/product.schema';
import { Reserva, ReservaSchema } from '../reservas/schemas/reserva.schema';
import { Socio, SocioSchema } from '../socios/schemas/socio.schema';
import { ReservasModule } from '../reservas/reservas.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Venta.name, schema: VentaSchema },
            { name: Product.name, schema: ProductSchema },
            { name: Reserva.name, schema: ReservaSchema },
            { name: Socio.name, schema: SocioSchema }
        ]),
        ReservasModule
    ],
    controllers: [VentasController],
    providers: [VentasService],
    exports: [VentasService]
})
export class VentasModule { } 