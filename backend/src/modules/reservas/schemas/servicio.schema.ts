import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ServicioDocument = Servicio & Document;

@Schema({ timestamps: true })
export class Servicio {
    @Prop({ required: true, unique: true })
    id: string;

    @Prop({ required: true })
    nombre: string;

    @Prop({ required: true, default: 0 })
    precio: number;

    @Prop({ required: true })
    color: string;

    @Prop({ required: true })
    colorConObservaciones: string;

    @Prop({ required: true, default: true })
    activo: boolean;
}

export const ServicioSchema = SchemaFactory.createForClass(Servicio); 