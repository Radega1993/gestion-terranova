import { IsString, IsNumber, IsBoolean, IsOptional, IsArray, ValidateNested, IsDate, Min, IsMongoId } from 'class-validator';
import { Type } from 'class-transformer';

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
    @IsOptional()
    telefonos?: string[];

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    emails?: string[];
}

export class AsociadoDto {
    @IsString()
    nombre: string;

    @IsDate()
    @Type(() => Date)
    @IsOptional()
    fechaNacimiento?: Date;

    @IsString()
    @IsOptional()
    fotografia?: string;
}

export class CreateSocioDto {
    @IsBoolean()
    @IsOptional()
    rgpd?: boolean;

    @IsString()
    @IsOptional()
    socio?: string;

    @IsNumber()
    @Min(1)
    @IsOptional()
    casa?: number;

    @IsNumber()
    @Min(1)
    @IsOptional()
    totalSocios?: number;

    @IsNumber()
    @Min(1)
    @IsOptional()
    numPersonas?: number;

    @IsNumber()
    @Min(0)
    @IsOptional()
    adheridos?: number;

    @IsNumber()
    @Min(0)
    @IsOptional()
    menor3Años?: number;

    @IsNumber()
    @Min(0)
    @IsOptional()
    cuota?: number;

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
    @Type(() => AsociadoDto)
    @IsOptional()
    asociados?: AsociadoDto[];

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => AsociadoDto)
    @IsOptional()
    especiales?: AsociadoDto[];

    @IsString()
    @IsOptional()
    notas?: string;

    @IsString()
    @IsOptional()
    fotografia?: string;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @IsMongoId()
    @IsOptional()
    socioPrincipal?: string;

    @IsArray()
    @IsMongoId({ each: true })
    @IsOptional()
    miembrosFamilia?: string[];
} 