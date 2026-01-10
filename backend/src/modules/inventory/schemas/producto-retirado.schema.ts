import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';

export type ProductoRetiradoDocument = ProductoRetirado & Document;

@Schema({ timestamps: true })
export class ProductoRetirado {
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Product', required: true })
    producto: Types.ObjectId;

    @Prop({ required: true, min: 1 })
    cantidad: number;

    @Prop({ required: true })
    motivo: string; // Ej: "Caducado", "Dañado", "Defectuoso", etc.

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
    usuarioRegistro: Types.ObjectId; // Usuario que registró la retirada

    @Prop({ type: Date, default: Date.now })
    fechaRetiro: Date;

    @Prop({ type: String })
    observaciones?: string;
}

export const ProductoRetiradoSchema = SchemaFactory.createForClass(ProductoRetirado);

