import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { ConfiguracionService } from '../services/configuracion.service';
import { UpdateNormativaDto } from '../dto/update-normativa.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../users/types/user-roles.enum';

@Controller('configuracion')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ConfiguracionController {
    constructor(private readonly configuracionService: ConfiguracionService) {}

    @Get('normativa')
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA, UserRole.TRABAJADOR, UserRole.TIENDA)
    async obtenerNormativa() {
        const texto = await this.configuracionService.obtenerNormativa();
        return { texto };
    }

    @Put('normativa')
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA)
    async actualizarNormativa(@Body() updateNormativaDto: UpdateNormativaDto) {
        return this.configuracionService.actualizarNormativa(updateNormativaDto);
    }
}






