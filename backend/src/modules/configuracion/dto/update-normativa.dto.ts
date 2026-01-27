import { IsString, IsNotEmpty } from 'class-validator';

export class UpdateNormativaDto {
    @IsString()
    @IsNotEmpty()
    texto: string;
}








