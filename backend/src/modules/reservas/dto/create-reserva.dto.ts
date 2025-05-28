import { IsDate, IsEnum, IsMongoId, IsNumber, IsOptional, IsString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { TipoInstalacion } from '../schemas/reserva.schema';

class SuplementoDto {
    @IsString()
    id: string;

    @IsNumber()
    @IsOptional()
    cantidad?: number;
}

export class CreateReservaDto {
    @IsDate()
    @Type(() => Date)
    fecha: Date;

    @IsEnum(TipoInstalacion)
    tipoInstalacion: TipoInstalacion;

    @IsMongoId()
    socio: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => SuplementoDto)
    suplementos: SuplementoDto[];

    @IsNumber()
    precio: number;

    @IsString()
    @IsOptional()
    observaciones?: string;
} 