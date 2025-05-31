import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SocioInvitacionesDocument = SocioInvitaciones & Document;

@Schema({ timestamps: true })
export class SocioInvitaciones extends Document {
    @Prop({ type: Types.ObjectId, ref: 'Socio', required: true })
    socio: Types.ObjectId;

    @Prop({ required: true })
    ejercicio: number; // Año del ejercicio (año de inicio, ej: 2024 para 2024-2025)

    @Prop({ required: true, default: 12 })
    invitacionesDisponibles: number;

    @Prop()
    observaciones?: string;

    @Prop({ type: Types.ObjectId, ref: 'User' })
    usuarioActualizacion?: Types.ObjectId;
}

export const SocioInvitacionesSchema = SchemaFactory.createForClass(SocioInvitaciones); 