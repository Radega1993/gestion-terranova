import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Suplemento extends Document {
    @Prop({ required: true })
    nombre: string;

    @Prop({ required: true })
    descripcion: string;

    @Prop({ required: true })
    precio: number;

    @Prop({ default: true })
    activo: boolean;
}

export const SuplementoSchema = SchemaFactory.createForClass(Suplemento); 