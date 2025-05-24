import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { Suplemento } from './suplemento.schema';

export enum EstadoReserva {
    PENDIENTE = 'PENDIENTE',
    CONFIRMADA = 'CONFIRMADA',
    CANCELADA = 'CANCELADA',
    COMPLETADA = 'COMPLETADA',
    LISTA_ESPERA = 'LISTA_ESPERA',
    LIQUIDADA = 'LIQUIDADA'
}

@Schema({ timestamps: true })
export class Reserva extends Document {
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Socio', required: true })
    socio: string;

    @Prop({ required: true })
    fechaInicio: Date;

    @Prop({ required: true })
    fechaFin: Date;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Instalacion', required: true })
    instalacion: string;

    @Prop({ required: true })
    precio: number;

    @Prop()
    observaciones?: string;

    @Prop([{
        servicio: { type: MongooseSchema.Types.ObjectId, ref: 'Servicio' },
        cantidad: Number,
        precio: Number
    }])
    servicios?: Array<{
        servicio: string;
        cantidad: number;
        precio: number;
    }>;

    @Prop([{
        suplemento: { type: MongooseSchema.Types.ObjectId, ref: 'Suplemento' },
        cantidad: Number,
        precio: Number
    }])
    suplementos?: Array<{
        suplemento: string;
        cantidad: number;
        precio: number;
    }>;

    @Prop({ default: 'PENDIENTE' })
    estado: 'PENDIENTE' | 'CONFIRMADA' | 'CANCELADA' | 'LIQUIDADA';

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
    usuarioCreacion: string;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
    usuarioActualizacion?: string;

    @Prop({ default: 0 })
    montoAbonado: number;

    @Prop()
    metodoPago: string;

    @Prop({ type: String, enum: EstadoReserva, default: EstadoReserva.PENDIENTE })
    estadoReserva: EstadoReserva;

    @Prop()
    motivoCancelacion: string;

    @Prop()
    observacionesCancelacion: string;

    @Prop({ default: 0 })
    montoDevuelto: number;

    @Prop({ default: false })
    pendienteRevisionJunta: boolean;
}

export const ReservaSchema = SchemaFactory.createForClass(Reserva); 