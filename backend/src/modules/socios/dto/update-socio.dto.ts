import { PartialType } from '@nestjs/mapped-types';
import { CreateSocioDto } from './create-socio.dto';

export class UpdateSocioDto extends PartialType(CreateSocioDto) {
    _id: any;
    __v: any;
    createdAt: any;
    updatedAt: any;
} 