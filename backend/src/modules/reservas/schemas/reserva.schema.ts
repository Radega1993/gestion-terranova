import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

export type ReservaDocument = Reserva & Document;

export enum EstadoReserva {
    PENDIENTE = 'PENDIENTE',
    CONFIRMADA = 'CONFIRMADA',
    CANCELADA = 'CANCELADA',
    COMPLETADA = 'COMPLETADA',
    LISTA_ESPERA = 'LISTA_ESPERA',
    LIQUIDADA = 'LIQUIDADA'
}

export enum MetodoPago {
    EFECTIVO = 'efectivo',
    TARJETA = 'tarjeta'
}

export enum TipoInstalacion {
    PISCINA = 'PISCINA',
    BBQ = 'BBQ',
    SALON = 'SALON',
    PADEL = 'PADEL'
}

@Schema({ timestamps: true })
export class Reserva {
    @Prop({ required: true, type: Date })
    fecha: Date;

    @Prop({ required: true, enum: TipoInstalacion })
    tipoInstalacion: TipoInstalacion;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
    usuarioCreacion: MongooseSchema.Types.ObjectId;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
    usuarioActualizacion?: MongooseSchema.Types.ObjectId;

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
        _id: MongooseSchema.Types.ObjectId;
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

    @Prop({ enum: MetodoPago })
    metodoPago?: MetodoPago;

    @Prop({ type: Boolean, default: false })
    pendienteRevisionJunta?: boolean;
}

export const ReservaSchema = SchemaFactory.createForClass(Reserva); 