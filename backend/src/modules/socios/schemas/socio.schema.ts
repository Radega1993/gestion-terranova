import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ _id: false })
class Nombre {
    @Prop({ required: true })
    nombre: string;

    @Prop({ required: true })
    primerApellido: string;

    @Prop()
    segundoApellido: string;
}

@Schema({ _id: false })
class Direccion {
    @Prop({ required: true })
    calle: string;

    @Prop({ required: true })
    numero: string;

    @Prop()
    piso: string;

    @Prop({ required: true })
    poblacion: string;

    @Prop()
    cp: string;

    @Prop()
    provincia: string;
}

@Schema({ _id: false })
class Banco {
    @Prop()
    iban: string;

    @Prop()
    entidad: string;

    @Prop()
    oficina: string;

    @Prop()
    dc: string;

    @Prop()
    cuenta: string;
}

@Schema({ _id: false })
class Contacto {
    @Prop({ type: [String], default: [''] })
    telefonos: string[];

    @Prop({ type: [String], default: [''] })
    emails: string[];
}

@Schema({ _id: false })
export class Asociado {
    @Prop()
    _id: MongooseSchema.Types.ObjectId;

    @Prop({ required: true })
    nombre: string;

    @Prop()
    fechaNacimiento: Date;

    @Prop()
    foto: string;
}

@Schema({ timestamps: true })
export class Socio extends Document {
    @Prop({ required: true, default: false })
    rgpd: boolean;

    @Prop()
    socio: string;

    @Prop({ required: true, default: 1 })
    casa: number;

    @Prop({ required: true, default: 1 })
    totalSocios: number;

    @Prop({ required: true, default: 1 })
    numPersonas: number;

    @Prop({ default: 0 })
    adheridos: number;

    @Prop({ default: 0 })
    menor3Años: number;

    @Prop({ required: true, default: 0 })
    cuota: number;

    @Prop()
    dni: string;

    @Prop({ type: Nombre, required: true })
    nombre: Nombre;

    @Prop({ type: Direccion, required: true })
    direccion: Direccion;

    @Prop({ type: Banco })
    banco: Banco;

    @Prop({ type: Contacto, required: true })
    contacto: Contacto;

    @Prop({ type: [Asociado], default: [] })
    asociados: Asociado[];

    @Prop({ type: [Asociado], default: [] })
    especiales: Asociado[];

    @Prop()
    notas: string;

    @Prop()
    fotografia: string;

    @Prop({ default: true })
    isActive: boolean;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Socio' })
    socioPrincipal: Socio;

    @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Socio' }] })
    miembrosFamilia: Socio[];

    @Prop()
    foto: string;

    @Prop()
    fechaBaja: Date;

    @Prop()
    motivoBaja: string;

    @Prop()
    observaciones: string;

    @Prop()
    fechaNacimiento: Date;
}

export const SocioSchema = SchemaFactory.createForClass(Socio); 