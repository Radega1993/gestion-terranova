import { IsString, IsNumber, IsBoolean, IsArray, ValidateNested, IsOptional, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { Asociado } from '../schemas/socio.schema';

export class NombreDto {
    @IsString()
    nombre: string;

    @IsString()
    primerApellido: string;

    @IsString()
    @IsOptional()
    segundoApellido?: string;
}

export class DireccionDto {
    @IsString()
    calle: string;

    @IsString()
    numero: string;

    @IsString()
    @IsOptional()
    piso?: string;

    @IsString()
    poblacion: string;

    @IsString()
    @IsOptional()
    cp?: string;

    @IsString()
    @IsOptional()
    provincia?: string;
}

export class BancoDto {
    @IsString()
    @IsOptional()
    iban?: string;

    @IsString()
    @IsOptional()
    entidad?: string;

    @IsString()
    @IsOptional()
    oficina?: string;

    @IsString()
    @IsOptional()
    dc?: string;

    @IsString()
    @IsOptional()
    cuenta?: string;
}

export class ContactoDto {
    @IsArray()
    @IsString({ each: true })
    telefonos: string[];

    @IsArray()
    @IsString({ each: true })
    emails: string[];
}

export class CreateSocioDto {
    @IsBoolean()
    @IsOptional()
    rgpd?: boolean;

    @IsString()
    @IsOptional()
    socio?: string;

    @IsNumber()
    casa: number;

    @IsNumber()
    totalSocios: number;

    @IsNumber()
    @IsOptional()
    menor3Años?: number;

    @IsNumber()
    cuota: number;

    @IsString()
    @IsOptional()
    dni?: string;

    @ValidateNested()
    @Type(() => NombreDto)
    nombre: NombreDto;

    @ValidateNested()
    @Type(() => DireccionDto)
    direccion: DireccionDto;

    @ValidateNested()
    @Type(() => BancoDto)
    @IsOptional()
    banco?: BancoDto;

    @ValidateNested()
    @Type(() => ContactoDto)
    contacto: ContactoDto;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => Asociado)
    @IsOptional()
    asociados?: Asociado[];

    @IsString()
    @IsOptional()
    notas?: string;

    @IsString()
    @IsOptional()
    foto?: string;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @IsDate()
    @Type(() => Date)
    @IsOptional()
    fechaNacimiento?: Date;

    @IsDate()
    @Type(() => Date)
    @IsOptional()
    fechaBaja?: Date;

    @IsString()
    @IsOptional()
    motivoBaja?: string;

    @IsString()
    @IsOptional()
    observaciones?: string;
} 