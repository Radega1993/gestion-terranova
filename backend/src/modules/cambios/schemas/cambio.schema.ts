import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type CambioDocument = Cambio & Document;

@Schema({ timestamps: true })
export class ProductoCambio {
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
export class Cambio {
    @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'Venta' })
    venta: MongooseSchema.Types.ObjectId;

    @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'User' })
    usuario: MongooseSchema.Types.ObjectId;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Trabajador' })
    trabajador?: MongooseSchema.Types.ObjectId;  // Trabajador que realizó el cambio (si usuario es TIENDA)

    // Producto original (el que se devuelve)
    @Prop({
        type: {
            nombre: { type: String, required: true },
            categoria: { type: String },
            cantidad: { type: Number, required: true },
            precioUnitario: { type: Number, required: true },
            total: { type: Number, required: true }
        },
        required: true
    })
    productoOriginal: ProductoCambio;

    // Producto nuevo (el que se entrega)
    @Prop({
        type: {
            nombre: { type: String, required: true },
            categoria: { type: String },
            cantidad: { type: Number, required: true },
            precioUnitario: { type: Number, required: true },
            total: { type: Number, required: true }
        },
        required: true
    })
    productoNuevo: ProductoCambio;

    // Diferencia de precio (positivo = hay que cobrar más, negativo = hay que devolver, 0 = igual precio)
    @Prop({ required: true, type: Number })
    diferenciaPrecio: number;

    @Prop({ type: String })
    motivo?: string;

    @Prop({ type: String })
    observaciones?: string;

    // Información del pago/devolución
    @Prop({ type: String, enum: ['EFECTIVO', 'TARJETA'] })
    metodoPago?: string;  // Método de pago/devolución

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Trabajador' })
    trabajadorPago?: MongooseSchema.Types.ObjectId;  // Trabajador que procesó el pago/devolución (si usuario es TIENDA)

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
    usuarioPago?: MongooseSchema.Types.ObjectId;  // Usuario que procesó el pago/devolución (si usuario NO es TIENDA)

    @Prop({ type: String, enum: ['PENDIENTE', 'PAGADO', 'DEVUELTO'], default: 'PENDIENTE' })
    estadoPago?: string;  // Estado del pago/devolución
}

export const CambioSchema = SchemaFactory.createForClass(Cambio);

