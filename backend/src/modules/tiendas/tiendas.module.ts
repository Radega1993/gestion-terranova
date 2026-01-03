import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TiendasController } from './controllers/tiendas.controller';
import { TiendasService } from './services/tiendas.service';
import { Tienda, TiendaSchema } from './schemas/tienda.schema';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Tienda.name, schema: TiendaSchema }
        ]),
        forwardRef(() => UsersModule)
    ],
    controllers: [TiendasController],
    providers: [TiendasService],
    exports: [TiendasService]
})
export class TiendasModule { }

