import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VentasController } from './controllers/ventas.controller';
import { VentasService } from './services/ventas.service';
import { Venta, VentaSchema } from './schemas/venta.schema';
import { Product, ProductSchema } from '../inventory/schemas/product.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Venta.name, schema: VentaSchema },
            { name: Product.name, schema: ProductSchema }
        ])
    ],
    controllers: [VentasController],
    providers: [VentasService],
    exports: [VentasService]
})
export class VentasModule { } 