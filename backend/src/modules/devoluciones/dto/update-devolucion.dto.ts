import { PartialType } from '@nestjs/mapped-types';
import { CreateDevolucionDto } from './create-devolucion.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { EstadoDevolucion } from '../schemas/devolucion.schema';

export class UpdateDevolucionDto extends PartialType(CreateDevolucionDto) {
    @IsEnum(EstadoDevolucion)
    @IsOptional()
    estado?: EstadoDevolucion;
}











