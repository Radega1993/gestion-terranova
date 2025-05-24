import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Servicio extends Document {
    @Prop({ required: true })
    nombre: string;

    @Prop({ required: true })
    descripcion: string;

    @Prop({ required: true })
    precio: number;

    @Prop({ default: true })
    activo: boolean;
}

export const ServicioSchema = SchemaFactory.createForClass(Servicio); 