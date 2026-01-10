import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfiguracionController } from './controllers/configuracion.controller';
import { ConfiguracionService } from './services/configuracion.service';
import { Normativa, NormativaSchema } from './schemas/normativa.schema';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Normativa.name, schema: NormativaSchema }])
    ],
    controllers: [ConfiguracionController],
    providers: [ConfiguracionService],
    exports: [ConfiguracionService]
})
export class ConfiguracionModule {}




