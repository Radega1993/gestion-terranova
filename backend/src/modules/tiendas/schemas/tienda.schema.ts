import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TiendaDocument = Tienda & Document;

@Schema({ timestamps: true })
export class Tienda {
    _id: Types.ObjectId;

    @Prop({ required: true, unique: true })
    nombre: string;

    @Prop({ required: true, unique: true })
    codigo: string;  // Código único de la tienda

    @Prop({ type: String })
    descripcion?: string;

    @Prop({ required: true, default: true })
    activa: boolean;

    @Prop({ type: Types.ObjectId, ref: 'User' })
    usuarioAsignado?: Types.ObjectId;  // Usuario TIENDA asignado a esta tienda

    createdAt: Date;
    updatedAt: Date;
}

export const TiendaSchema = SchemaFactory.createForClass(Tienda);









