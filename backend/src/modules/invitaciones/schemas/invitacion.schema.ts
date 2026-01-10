import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type InvitacionDocument = Invitacion & Document;

@Schema({ timestamps: true })
export class Invitacion extends Document {
    @Prop({ type: Types.ObjectId, ref: 'Socio', required: true })
    socio: Types.ObjectId;

    @Prop({ required: true })
    fechaUso: Date;

    @Prop({ required: true })
    nombreInvitado: string;

    @Prop()
    observaciones?: string;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    usuarioRegistro: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Trabajador' })
    trabajador?: Types.ObjectId;  // Trabajador asignado (solo si usuarioRegistro es TIENDA)

    @Prop({ required: true })
    ejercicio: number;
}

export const InvitacionSchema = SchemaFactory.createForClass(Invitacion); 