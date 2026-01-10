import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VentasController } from './controllers/ventas.controller';
import { VentasService } from './services/ventas.service';
import { Venta, VentaSchema } from './schemas/venta.schema';
import { Product, ProductSchema } from '../inventory/schemas/product.schema';
import { Reserva, ReservaSchema } from '../reservas/schemas/reserva.schema';
import { Socio, SocioSchema } from '../socios/schemas/socio.schema';
import { Trabajador, TrabajadorSchema } from '../users/schemas/trabajador.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { ReservasModule } from '../reservas/reservas.module';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Venta.name, schema: VentaSchema },
            { name: Product.name, schema: ProductSchema },
            { name: Reserva.name, schema: ReservaSchema },
            { name: Socio.name, schema: SocioSchema },
            { name: Trabajador.name, schema: TrabajadorSchema },
            { name: User.name, schema: UserSchema }
        ]),
        ReservasModule,
        UsersModule
    ],
    controllers: [VentasController],
    providers: [VentasService],
    exports: [VentasService]
})
export class VentasModule { } 