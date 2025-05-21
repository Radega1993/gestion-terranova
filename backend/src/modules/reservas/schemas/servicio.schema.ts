import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Servicio extends Document {
    @Prop({ required: true })
    nombre: string;

    @Prop({ required: true })
    precio: number;

    @Prop({ required: true })
    color: string;

    @Prop({ required: true })
    colorConObservaciones: string;

    @Prop({ default: true })
    activo: boolean;

    @Prop()
    descripcion?: string;
}

export const ServicioSchema = SchemaFactory.createForClass(Servicio); 