import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ _id: false })
export class Asociado {
    @Prop({ required: false })
    _id?: MongooseSchema.Types.ObjectId;

    @Prop({ required: true })
    codigo: string;

    @Prop({ required: true })
    nombre: string;

    @Prop()
    fechaNacimiento: Date;

    @Prop()
    telefono: string;

    @Prop()
    foto: string;
}

export const AsociadoSchema = SchemaFactory.createForClass(Asociado); 