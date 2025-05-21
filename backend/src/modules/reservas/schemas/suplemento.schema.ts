import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum TipoSuplemento {
    FIJO = 'FIJO',
    HORARIO = 'HORARIO'
}

@Schema({ timestamps: true })
export class Suplemento extends Document {
    @Prop({ required: true })
    nombre: string;

    @Prop({ required: true })
    precio: number;

    @Prop({ type: String, enum: TipoSuplemento, required: true })
    tipo: TipoSuplemento;

    @Prop({ default: 1 })
    cantidad: number;
}

export const SuplementoSchema = SchemaFactory.createForClass(Suplemento); 