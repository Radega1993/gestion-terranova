import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, Logger, UnauthorizedException } from '@nestjs/common';
import { TiendasService } from '../services/tiendas.service';
import { CreateTiendaDto } from '../dto/create-tienda.dto';
import { UpdateTiendaDto } from '../dto/update-tienda.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../users/types/user-roles.enum';

@Controller('tiendas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TiendasController {
    private readonly logger = new Logger(TiendasController.name);

    constructor(private readonly tiendasService: TiendasService) { }

    @Post()
    @Roles(UserRole.ADMINISTRADOR)  // Solo ADMINISTRADOR puede crear tiendas
    async create(@Body() createTiendaDto: CreateTiendaDto) {
        return this.tiendasService.create(createTiendaDto);
    }

    @Get()
    @Roles(UserRole.ADMINISTRADOR, UserRole.TIENDA)
    async findAll(@Request() req) {
        // Si es TIENDA, solo puede ver su propia tienda
        if (req.user.role === 'TIENDA') {
            const tienda = await this.tiendasService.findByUsuario(req.user._id);
            return tienda ? [tienda] : [];
        }
        return this.tiendasService.findAll();
    }

    @Get('activas')
    @Roles(UserRole.ADMINISTRADOR)
    async findActive() {
        return this.tiendasService.findActive();
    }

    @Get('mi-tienda')
    @Roles(UserRole.TIENDA)
    async getMiTienda(@Request() req) {
        const tienda = await this.tiendasService.findByUsuario(req.user._id);
        if (!tienda) {
            throw new UnauthorizedException('No tiene una tienda asignada');
        }
        return tienda;
    }

    @Get(':id')
    @Roles(UserRole.ADMINISTRADOR, UserRole.TIENDA)
    async findOne(@Param('id') id: string, @Request() req) {
        const tienda = await this.tiendasService.findOne(id);
        
        // Si es TIENDA, solo puede ver su propia tienda
        if (req.user.role === 'TIENDA' && tienda.usuarioAsignado?.toString() !== req.user._id.toString()) {
            throw new UnauthorizedException('No tiene permiso para ver esta tienda');
        }
        
        return tienda;
    }

    @Put(':id')
    @Roles(UserRole.ADMINISTRADOR)
    async update(@Param('id') id: string, @Body() updateTiendaDto: UpdateTiendaDto) {
        return this.tiendasService.update(id, updateTiendaDto);
    }

    @Delete(':id')
    @Roles(UserRole.ADMINISTRADOR)
    async remove(@Param('id') id: string) {
        return this.tiendasService.remove(id);
    }

    @Put(':id/toggle-active')
    @Roles(UserRole.ADMINISTRADOR)
    async toggleActive(@Param('id') id: string) {
        return this.tiendasService.toggleActive(id);
    }
}

