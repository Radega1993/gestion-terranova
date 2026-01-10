import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema } from './schemas/product.schema';
import { ProductoRetirado, ProductoRetiradoSchema } from './schemas/producto-retirado.schema';
import { InventoryController } from './controllers/inventory.controller';
import { InventoryService } from './services/inventory.service';
import { ProductosRetiradosService } from './services/productos-retirados.service';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Product.name, schema: ProductSchema },
            { name: ProductoRetirado.name, schema: ProductoRetiradoSchema }
        ]),
        MulterModule.register({
            storage: memoryStorage(),
        }),
    ],
    controllers: [InventoryController],
    providers: [InventoryService, ProductosRetiradosService],
    exports: [InventoryService, ProductosRetiradosService],
})
export class InventoryModule { } 