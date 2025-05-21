import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export interface ProductDocument extends Document {
    _id: Types.ObjectId;
    nombre: string;
    tipo: string;
    unidad_medida: string;
    stock_actual: number;
    precio_compra_unitario: number;
    activo: boolean;
    createdAt: Date;
    updatedAt: Date;
}

@Schema({ timestamps: true })
export class Product {
    @Prop({ required: true })
    nombre: string;

    @Prop({ required: true })
    tipo: string;

    @Prop({ required: true })
    unidad_medida: string;

    @Prop({ required: true, min: 0 })
    stock_actual: number;

    @Prop({ required: true, min: 0 })
    precio_compra_unitario: number;

    @Prop({ default: true })
    activo: boolean;

    createdAt: Date;
    updatedAt: Date;
}

export const ProductSchema = SchemaFactory.createForClass(Product); 