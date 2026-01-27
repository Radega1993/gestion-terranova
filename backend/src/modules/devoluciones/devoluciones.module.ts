import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DevolucionesController } from './controllers/devoluciones.controller';
import { DevolucionesService } from './services/devoluciones.service';
import { Devolucion, DevolucionSchema } from './schemas/devolucion.schema';
import { Venta, VentaSchema } from '../ventas/schemas/venta.schema';
import { Product, ProductSchema } from '../inventory/schemas/product.schema';
import { UsersModule } from '../users/users.module';
import { TiendasModule } from '../tiendas/tiendas.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Devolucion.name, schema: DevolucionSchema },
            { name: Venta.name, schema: VentaSchema },
            { name: Product.name, schema: ProductSchema }
        ]),
        forwardRef(() => UsersModule),
        forwardRef(() => TiendasModule)
    ],
    controllers: [DevolucionesController],
    providers: [DevolucionesService],
    exports: [DevolucionesService]
})
export class DevolucionesModule { }











