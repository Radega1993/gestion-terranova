import { Controller, Get, Post, Body, Put, Delete, Param, UseGuards, Request, Logger, Query, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { TrabajadoresService } from '../services/trabajadores.service';
import { CreateTrabajadorDto } from '../dto/create-trabajador.dto';
import { UpdateTrabajadorDto } from '../dto/update-trabajador.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../users/types/user-roles.enum';
import { TiendasService } from '../../tiendas/services/tiendas.service';
import { UsersService } from '../../users/users.service';

@Controller('trabajadores')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TrabajadoresController {
    private readonly logger = new Logger(TrabajadoresController.name);

    constructor(
        private readonly trabajadoresService: TrabajadoresService,
        private readonly tiendasService: TiendasService,
        private readonly usersService: UsersService
    ) { }

    @Post()
    @Roles(UserRole.ADMINISTRADOR, UserRole.TIENDA)
    async create(@Body() createTrabajadorDto: CreateTrabajadorDto, @Request() req) {
        let tiendaId: string;

        if (req.user.role === 'TIENDA') {
            // Si es TIENDA, obtener su tienda asignada
            const user = await this.usersService.findOne(req.user._id);
            if (!user.tienda) {
                throw new BadRequestException('No tiene una tienda asignada. Contacte al administrador.');
            }
            tiendaId = user.tienda.toString();
            
            // Asegurar que el trabajador se asigna a su tienda
            createTrabajadorDto.tienda = tiendaId;
        } else {
            // ADMINISTRADOR debe especificar la tienda
            if (!createTrabajadorDto.tienda) {
                throw new BadRequestException('Debe especificar una tienda para crear el trabajador');
            }
            tiendaId = createTrabajadorDto.tienda;
        }

        return this.trabajadoresService.create(createTrabajadorDto, tiendaId);
    }

    @Get()
    @Roles(UserRole.ADMINISTRADOR, UserRole.TIENDA)
    async findAll(@Query('tiendaId') tiendaId?: string, @Request() req?) {
        if (req.user.role === 'TIENDA') {
            // Si es TIENDA, obtener su tienda y mostrar solo sus trabajadores
            const user = await this.usersService.findOne(req.user._id);
            if (!user.tienda) {
                return [];  // No tiene tienda asignada
            }
            return this.trabajadoresService.findByTienda(user.tienda.toString());
        }
        
        // ADMINISTRADOR puede ver todos o filtrar por tienda
        if (tiendaId) {
            return this.trabajadoresService.findByTienda(tiendaId);
        }
        return this.trabajadoresService.findAll();
    }

    @Get('mi-tienda')
    @Roles(UserRole.TIENDA)
    async getMisTrabajadores(@Request() req) {
        const user = await this.usersService.findOne(req.user._id);
        if (!user.tienda) {
            throw new BadRequestException('No tiene una tienda asignada');
        }
        return this.trabajadoresService.findByTienda(user.tienda.toString());
    }

    @Get('tienda/:tiendaId')
    @Roles(UserRole.ADMINISTRADOR, UserRole.TIENDA)
    async findByTienda(@Param('tiendaId') tiendaId: string, @Request() req) {
        if (req.user.role === 'TIENDA') {
            // Si es TIENDA, solo puede ver trabajadores de su tienda
            const user = await this.usersService.findOne(req.user._id);
            if (!user.tienda || user.tienda.toString() !== tiendaId) {
                throw new UnauthorizedException('No tiene permiso para ver estos trabajadores');
            }
        }
        return this.trabajadoresService.findByTienda(tiendaId);
    }

    @Get(':id')
    @Roles(UserRole.ADMINISTRADOR)
    async findOne(@Param('id') id: string) {
        return this.trabajadoresService.findOne(id);
    }

    @Put(':id')
    @Roles(UserRole.ADMINISTRADOR, UserRole.TIENDA)
    async update(@Param('id') id: string, @Body() updateTrabajadorDto: UpdateTrabajadorDto, @Request() req) {
        if (req.user.role === 'TIENDA') {
            // Verificar que el trabajador pertenece a su tienda
            const trabajador = await this.trabajadoresService.findOne(id);
            const user = await this.usersService.findOne(req.user._id);
            if (!user.tienda || trabajador.tienda.toString() !== user.tienda.toString()) {
                throw new UnauthorizedException('No tiene permiso para modificar este trabajador');
            }
        }
        return this.trabajadoresService.update(id, updateTrabajadorDto);
    }

    @Delete(':id')
    @Roles(UserRole.ADMINISTRADOR, UserRole.TIENDA)
    async remove(@Param('id') id: string, @Request() req) {
        if (req.user.role === 'TIENDA') {
            // Verificar que el trabajador pertenece a su tienda
            const trabajador = await this.trabajadoresService.findOne(id);
            const user = await this.usersService.findOne(req.user._id);
            if (!user.tienda || trabajador.tienda.toString() !== user.tienda.toString()) {
                throw new UnauthorizedException('No tiene permiso para eliminar este trabajador');
            }
        }
        return this.trabajadoresService.remove(id);
    }

    @Put(':id/toggle-active')
    @Roles(UserRole.ADMINISTRADOR, UserRole.TIENDA)
    async toggleActive(@Param('id') id: string, @Request() req) {
        if (req.user.role === 'TIENDA') {
            // Verificar que el trabajador pertenece a su tienda
            const trabajador = await this.trabajadoresService.findOne(id);
            const user = await this.usersService.findOne(req.user._id);
            if (!user.tienda || trabajador.tienda.toString() !== user.tienda.toString()) {
                throw new UnauthorizedException('No tiene permiso para modificar este trabajador');
            }
        }
        return this.trabajadoresService.toggleActive(id);
    }
}

