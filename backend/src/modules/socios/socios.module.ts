import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SociosController } from './controllers/socios.controller';
import { SociosService } from './services/socios.service';
import { Socio, SocioSchema } from './schemas/socio.schema';
import { UploadsModule } from '../uploads/uploads.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Socio.name, schema: SocioSchema }
        ]),
        UploadsModule
    ],
    controllers: [SociosController],
    providers: [SociosService],
    exports: [SociosService]
})
export class SociosModule { } 