import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type NormativaDocument = Normativa & Document;

@Schema({ timestamps: true })
export class Normativa {
    @Prop({ required: true, unique: true, default: 'normativa-reservas' })
    clave: string;

    @Prop({ required: true, type: String })
    texto: string;

    @Prop({ type: Date })
    ultimaActualizacion?: Date;
}

export const NormativaSchema = SchemaFactory.createForClass(Normativa);





