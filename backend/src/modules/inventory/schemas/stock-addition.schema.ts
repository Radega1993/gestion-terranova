import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';

export type StockAdditionDocument = StockAddition & Document;

@Schema({ timestamps: true })
export class StockAddition {
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Product', required: true })
    producto: Types.ObjectId;

    @Prop({ required: true, min: 1 })
    cantidad: number;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
    usuarioRegistro: Types.ObjectId;

    @Prop({ default: Date.now })
    fechaRegistro: Date;

    @Prop()
    observaciones?: string;
}

export const StockAdditionSchema = SchemaFactory.createForClass(StockAddition);
