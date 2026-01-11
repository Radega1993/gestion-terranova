import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Query, BadRequestException, Logger, Req } from '@nestjs/common';
import { DevolucionesService } from '../services/devoluciones.service';
import { CreateDevolucionDto } from '../dto/create-devolucion.dto';
import { UpdateDevolucionDto } from '../dto/update-devolucion.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../users/guards/roles.guard';
import { Roles } from '../../users/decorators/roles.decorator';
import { UserRole } from '../../users/types/user-roles.enum';
import { Request } from 'express';

@Controller('devoluciones')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DevolucionesController {
    private readonly logger = new Logger(DevolucionesController.name);

    constructor(private readonly devolucionesService: DevolucionesService) { }

    @Post()
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA)
    async create(@Body() createDevolucionDto: CreateDevolucionDto, @Req() req) {
        try {
            return this.devolucionesService.create(createDevolucionDto, req.user._id, req.user.role);
        } catch (error) {
            this.logger.error(`Error al crear devolución:`, error);
            throw error;
        }
    }

    @Get()
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA)
    async findAll(
        @Query('fechaInicio') fechaInicio?: string,
        @Query('fechaFin') fechaFin?: string,
        @Query('ventaId') ventaId?: string,
        @Query('usuarioId') usuarioId?: string
    ) {
        const filters: any = {};
        
        if (fechaInicio) {
            filters.fechaInicio = new Date(fechaInicio);
        }
        if (fechaFin) {
            filters.fechaFin = new Date(fechaFin);
        }
        if (ventaId) {
            filters.ventaId = ventaId;
        }
        if (usuarioId) {
            filters.usuarioId = usuarioId;
        }

        return this.devolucionesService.findAll(filters);
    }

    @Get(':id')
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA)
    async findOne(@Param('id') id: string) {
        return this.devolucionesService.findOne(id);
    }

    @Put(':id')
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA)
    async update(@Param('id') id: string, @Body() updateDevolucionDto: UpdateDevolucionDto) {
        try {
            return this.devolucionesService.update(id, updateDevolucionDto);
        } catch (error) {
            this.logger.error(`Error al actualizar devolución:`, error);
            throw error;
        }
    }

    @Post(':id/procesar')
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA)
    async procesar(@Param('id') id: string, @Req() req) {
        try {
            return this.devolucionesService.procesar(id, req.user._id);
        } catch (error) {
            this.logger.error(`Error al procesar devolución:`, error);
            throw error;
        }
    }

    @Post(':id/cancelar')
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA)
    async cancelar(@Param('id') id: string) {
        try {
            return this.devolucionesService.cancelar(id);
        } catch (error) {
            this.logger.error(`Error al cancelar devolución:`, error);
            throw error;
        }
    }

    @Delete(':id')
    @Roles(UserRole.ADMINISTRADOR)
    async remove(@Param('id') id: string) {
        try {
            await this.devolucionesService.remove(id);
            return { message: 'Devolución eliminada exitosamente' };
        } catch (error) {
            this.logger.error(`Error al eliminar devolución:`, error);
            throw error;
        }
    }
}

