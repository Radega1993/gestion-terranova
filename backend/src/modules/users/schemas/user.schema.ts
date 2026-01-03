import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { UserRole } from '../types/user-roles.enum';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
    _id: Types.ObjectId;

    @Prop({ required: true, unique: true })
    username: string;

    @Prop({ required: true })
    password: string;

    @Prop({ required: true })
    nombre: string;

    @Prop()
    apellidos?: string;

    @Prop({ required: true, enum: UserRole, default: UserRole.TRABAJADOR })
    role: UserRole;

    @Prop({ type: Types.ObjectId, ref: 'Tienda' })
    tienda?: Types.ObjectId;  // Tienda asignada (solo para usuarios TIENDA)

    @Prop({ required: true, default: true })
    isActive: boolean;

    @Prop()
    lastLogin?: Date;

    @Prop()
    createdAt: Date;

    @Prop()
    updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User); 