import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

export type ReservaDocument = Reserva & Document;

export enum EstadoReserva {
    PENDIENTE = 'PENDIENTE',
    CONFIRMADA = 'CONFIRMADA',
    CANCELADA = 'CANCELADA',
    COMPLETADA = 'COMPLETADA',
    LIQUIDADA = 'LIQUIDADA',
    LISTA_ESPERA = 'LISTA_ESPERA'
}

export enum MetodoPago {
    EFECTIVO = 'efectivo',
    TARJETA = 'tarjeta'
}

@Schema({ timestamps: true })
export class Reserva {
    @Prop({ required: true, type: Date })
    fecha: Date;

    @Prop({ required: true, type: String })
    tipoInstalacion: string;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
    usuarioCreacion: MongooseSchema.Types.ObjectId;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
    usuarioActualizacion?: MongooseSchema.Types.ObjectId;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Trabajador' })
    trabajador?: MongooseSchema.Types.ObjectId;  // Trabajador asignado (solo si usuarioCreacion es TIENDA)

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Socio', required: true })
    socio: MongooseSchema.Types.ObjectId;

    @Prop({
        type: [{
            id: String,
            cantidad: Number,
            _id: MongooseSchema.Types.ObjectId
        }]
    })
    suplementos: Array<{
        id: string;
        cantidad?: number;
        _id?: MongooseSchema.Types.ObjectId;
    }>;

    @Prop({ required: true, type: Number })
    precio: number;

    @Prop({ required: true, enum: EstadoReserva, default: EstadoReserva.PENDIENTE })
    estado: EstadoReserva;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
    confirmadoPor?: MongooseSchema.Types.ObjectId;

    @Prop({ type: Date })
    fechaConfirmacion?: Date;

    @Prop({ type: Date })
    fechaCancelacion?: Date;

    @Prop({ type: Date })
    fechaLiquidacion?: Date;

    @Prop({ type: String })
    motivoCancelacion?: string;

    @Prop({ type: String })
    observaciones?: string;

    @Prop({ type: Number, default: 0 })
    montoAbonado?: number;

    @Prop({ type: Number, default: 0 })
    montoDevuelto?: number;

    @Prop({ type: Number, default: 0 })
    fianza?: number;

    @Prop({ enum: MetodoPago })
    metodoPago?: MetodoPago;

    @Prop({ type: Boolean, default: false })
    pendienteRevisionJunta?: boolean;

    @Prop({
        type: [{
            monto: Number,
            metodoPago: String,
            fecha: Date
        }]
    })
    pagos?: Array<{
        monto: number;
        metodoPago: string;
        fecha: Date;
    }>;

    @Prop({ type: Boolean, default: false })
    normativaAceptada?: boolean;

    @Prop({ type: String })
    firmaSocio?: string; // Base64 o URL de imagen de la firma

    @Prop({ type: Date })
    fechaAceptacionNormativa?: Date;
}

export const ReservaSchema = SchemaFactory.createForClass(Reserva); 