import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { UserRole } from '../types/user-roles.enum';

@Schema({ timestamps: true })
export class User extends Document {
    @Prop({ required: true, unique: true })
    username: string;

    @Prop({ required: true })
    password: string;

    @Prop({ required: true })
    nombre: string;

    @Prop({ required: true })
    apellidos: string;

    @Prop({ required: true, unique: true })
    email: string;

    @Prop({ type: String, enum: UserRole, default: UserRole.SOCIO })
    rol: UserRole;

    @Prop()
    telefono?: string;

    @Prop()
    direccion?: string;

    @Prop({ default: true })
    activo: boolean;

    @Prop()
    lastLogin?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User); 