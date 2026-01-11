import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type DevolucionDocument = Devolucion & Document;

export enum EstadoDevolucion {
    PENDIENTE = 'PENDIENTE',
    PROCESADA = 'PROCESADA',
    CANCELADA = 'CANCELADA'
}

export enum MetodoDevolucion {
    EFECTIVO = 'EFECTIVO',
    TARJETA = 'TARJETA'
}

@Schema({ timestamps: true })
export class ProductoDevolucion {
    @Prop({ required: true })
    nombre: string;

    @Prop()
    categoria?: string;

    @Prop({ required: true })
    cantidad: number;

    @Prop({ required: true })
    precioUnitario: number;

    @Prop({ required: true })
    total: number;
}

@Schema({ timestamps: true })
export class Devolucion {
    @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'Venta' })
    venta: MongooseSchema.Types.ObjectId;

    @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'User' })
    usuario: MongooseSchema.Types.ObjectId;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Trabajador' })
    trabajador?: MongooseSchema.Types.ObjectId;

    @Prop({
        type: [{
            nombre: { type: String, required: true },
            categoria: { type: String },
            cantidad: { type: Number, required: true },
            precioUnitario: { type: Number, required: true },
            total: { type: Number, required: true }
        }],
        required: true
    })
    productos: ProductoDevolucion[];

    @Prop({ required: true, type: Number })
    totalDevolucion: number;

    @Prop({ required: true, enum: MetodoDevolucion })
    metodoDevolucion: MetodoDevolucion;

    @Prop({ required: true })
    motivo: string;

    @Prop({ type: String })
    observaciones?: string;

    @Prop({ required: true, enum: EstadoDevolucion, default: EstadoDevolucion.PENDIENTE })
    estado: EstadoDevolucion;

    @Prop({ type: Date })
    fechaProcesamiento?: Date;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
    procesadoPor?: MongooseSchema.Types.ObjectId;
}

export const DevolucionSchema = SchemaFactory.createForClass(Devolucion);








