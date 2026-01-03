import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TrabajadorDocument = Trabajador & Document;

@Schema({ timestamps: true })
export class Trabajador {
    _id: Types.ObjectId;

    @Prop({ required: true })
    nombre: string;

    @Prop({ required: true, unique: true })
    identificador: string;  // Código único del trabajador

    @Prop({ required: true, type: Types.ObjectId, ref: 'Tienda' })
    tienda: Types.ObjectId;  // Tienda a la que pertenece

    @Prop({ required: true, default: true })
    activo: boolean;

    createdAt: Date;
    updatedAt: Date;
}

export const TrabajadorSchema = SchemaFactory.createForClass(Trabajador);

