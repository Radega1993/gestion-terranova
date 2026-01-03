import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type VentaDocument = Venta & Document;

@Schema({ timestamps: true })
export class Pago {
    @Prop({ required: true })
    fecha: Date;

    @Prop({ required: true })
    monto: number;

    @Prop({ required: true, enum: ['EFECTIVO', 'TARJETA'] })
    metodoPago: string;

    @Prop({ type: String })
    observaciones?: string;
}

@Schema({ timestamps: true })
export class Venta {
    @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'User' })
    usuario: MongooseSchema.Types.ObjectId;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Trabajador' })
    trabajador?: MongooseSchema.Types.ObjectId;  // Trabajador asignado (solo si usuario es TIENDA)

    @Prop({ required: true, type: String })
    codigoSocio: string;

    @Prop({ required: true, type: String })
    nombreSocio: string;

    @Prop({ required: true, type: Boolean })
    esSocio: boolean;

    @Prop({
        type: [{
            nombre: { type: String, required: true },
            categoria: { type: String },
            unidades: Number,
            precioUnitario: Number,
            precioTotal: Number
        }],
        required: true
    })
    productos: Array<{
        nombre: string;
        categoria?: string;
        unidades: number;
        precioUnitario: number;
        precioTotal: number;
    }>;

    @Prop({ required: true, type: Number })
    total: number;

    @Prop({ required: true, type: Number, default: 0 })
    pagado: number;

    @Prop({ required: true, type: String, enum: ['PENDIENTE', 'PAGADO_PARCIAL', 'PAGADO'], default: 'PENDIENTE' })
    estado: string;

    @Prop({ type: String, enum: ['EFECTIVO', 'TARJETA', 'TRANSFERENCIA'], default: 'EFECTIVO' })
    metodoPago: string;

    @Prop({ type: String })
    observaciones: string;

    @Prop({ type: [Pago], default: [] })
    pagos: Pago[];
}

export const VentaSchema = SchemaFactory.createForClass(Venta); 