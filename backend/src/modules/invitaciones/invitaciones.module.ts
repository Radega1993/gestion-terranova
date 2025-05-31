import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InvitacionesController } from './controllers/invitaciones.controller';
import { InvitacionesService } from './services/invitaciones.service';
import { Invitacion, InvitacionSchema } from './schemas/invitacion.schema';
import { SocioInvitaciones, SocioInvitacionesSchema } from './schemas/socio-invitaciones.schema';
import { Socio, SocioSchema } from '../socios/schemas/socio.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Invitacion.name, schema: InvitacionSchema },
            { name: SocioInvitaciones.name, schema: SocioInvitacionesSchema },
            { name: Socio.name, schema: SocioSchema }
        ])
    ],
    controllers: [InvitacionesController],
    providers: [InvitacionesService],
    exports: [InvitacionesService]
})
export class InvitacionesModule { } 