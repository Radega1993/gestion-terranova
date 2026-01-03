import { IsOptional, IsString, IsArray } from 'class-validator';
import { Transform } from 'class-transformer';

export class RecaudacionesFiltrosDto {
    @IsOptional()
    @IsString()
    fechaInicio?: string;

    @IsOptional()
    @IsString()
    fechaFin?: string;

    @IsOptional()
    @IsString()
    codigoSocio?: string;

    @IsOptional()
    @Transform(({ value }) => {
        // Si es undefined o null, devolver undefined
        if (value === undefined || value === null) return undefined;
        // Si es un string con comas (cuando NestJS concatena múltiples valores), dividirlo
        if (typeof value === 'string' && value.includes(',')) {
            return value.split(',').filter(v => v.trim() !== '');
        }
        // Si es un string simple, convertirlo a array
        if (typeof value === 'string') return [value];
        // Si es un array, devolverlo tal cual
        if (Array.isArray(value)) return value;
        return value;
    })
    @IsArray()
    @IsString({ each: true })
    usuario?: string | string[];

    @IsOptional()
    @Transform(({ value }) => {
        // Si es undefined o null, devolver undefined
        if (value === undefined || value === null) return undefined;
        // Si es un string con comas (cuando NestJS concatena múltiples valores), dividirlo
        if (typeof value === 'string' && value.includes(',')) {
            return value.split(',').filter(v => v.trim() !== '');
        }
        // Si es un string simple, convertirlo a array
        if (typeof value === 'string') return [value];
        // Si es un array, devolverlo tal cual
        if (Array.isArray(value)) return value;
        return value;
    })
    @IsArray()
    @IsString({ each: true })
    trabajadorId?: string | string[];  // Filtro por trabajador(es)
}
