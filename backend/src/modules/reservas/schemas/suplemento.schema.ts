import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SuplementoDocument = Suplemento & Document;

export enum TipoSuplemento {
    FIJO = 'fijo',
    POR_HORA = 'porHora'
}

@Schema({ timestamps: true })
export class Suplemento {
    @Prop({ required: true, unique: true })
    id: string;

    @Prop({ required: true })
    nombre: string;

    @Prop({ required: true, default: 0 })
    precio: number;

    @Prop({ required: true, enum: TipoSuplemento })
    tipo: TipoSuplemento;

    @Prop({ required: true, default: true })
    activo: boolean;
}

export const SuplementoSchema = SchemaFactory.createForClass(Suplemento); 