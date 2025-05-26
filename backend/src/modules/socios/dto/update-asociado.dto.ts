import { PartialType } from '@nestjs/mapped-types';
import { CreateAsociadoDto } from './create-asociado.dto';

export class UpdateAsociadoDto extends PartialType(CreateAsociadoDto) { } 