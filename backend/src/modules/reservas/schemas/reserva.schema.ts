import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { Suplemento } from './suplemento.schema';

export enum EstadoReserva {
    PENDIENTE = 'PENDIENTE',
    CONFIRMADA = 'CONFIRMADA',
    CANCELADA = 'CANCELADA',
    COMPLETADA = 'COMPLETADA'
}

@Schema({ timestamps: true })
export class Reserva extends Document {
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
    socio: User;

    @Prop({ required: true })
    tipoInstalacion: string;

    @Prop({ required: true })
    fecha: Date;

    @Prop({ required: true })
    hora: string;

    @Prop({ required: true })
    precio: number;

    @Prop({ default: 0 })
    montoAbonado: number;

    @Prop()
    metodoPago: string;

    @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Suplemento' }] })
    suplementos: Suplemento[];

    @Prop({ default: 'PENDIENTE' })
    estado: string;

    @Prop()
    observaciones: string;

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