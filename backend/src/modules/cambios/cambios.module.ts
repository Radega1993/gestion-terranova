import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CambiosController } from './controllers/cambios.controller';
import { CambiosService } from './services/cambios.service';
import { Cambio, CambioSchema } from './schemas/cambio.schema';
import { Venta, VentaSchema } from '../ventas/schemas/venta.schema';
import { Product, ProductSchema } from '../inventory/schemas/product.schema';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Cambio.name, schema: CambioSchema },
            { name: Venta.name, schema: VentaSchema },
            { name: Product.name, schema: ProductSchema }
        ]),
        UsersModule
    ],
    controllers: [CambiosController],
    providers: [CambiosService],
    exports: [CambiosService]
})
export class CambiosModule { }

