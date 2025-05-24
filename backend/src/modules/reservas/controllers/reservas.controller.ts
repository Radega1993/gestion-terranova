import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, UnauthorizedException, Logger, BadRequestException } from '@nestjs/common';
import { ReservasService } from '../services/reservas.service';
import { CreateReservaDto, UpdateReservaDto } from '../dto/reserva.dto';
import { LiquidarReservaDto } from '../dto/liquidar-reserva.dto';
import { CancelarReservaDto } from '../dto/cancelar-reserva.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import { User } from '../../users/schemas/user.schema';
import { UserRole } from '../../users/types/user-roles.enum';
import { Reserva } from '../schemas/reserva.schema';

@Controller('reservas')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA, UserRole.TRABAJADOR)
export class ReservasController {
    private readonly logger = new Logger(ReservasController.name);

    constructor(private readonly reservasService: ReservasService) { }

    @Post()
    @Roles(UserRole.ADMINISTRADOR, UserRole.TRABAJADOR)
    async create(@Body() createReservaDto: CreateReservaDto, @GetUser() user: User) {
        this.logger.debug('Recibida petición para crear reserva');
        try {
            return await this.reservasService.create(createReservaDto, user._id.toString());
        } catch (error) {
            this.logger.error('Error al crear reserva:', error);
            throw error;
        }
    }

    @Get()
    async findAll() {
        this.logger.debug('Recibida petición para obtener todas las reservas');
        try {
            return await this.reservasService.findAll();
        } catch (error) {
            this.logger.error('Error al obtener reservas:', error);
            throw error;
        }
    }

    @Get('usuario/:usuarioId')
    async findByUsuario(@Param('usuarioId') usuarioId: string) {
        try {
            this.logger.debug(`Buscando reservas para el usuario: ${usuarioId}`);
            const reservas = await this.reservasService.findByUsuario(usuarioId);
            this.logger.debug(`Encontradas ${reservas.length} reservas`);
            return reservas;
        } catch (error) {
            this.logger.error('Error al buscar reservas por usuario:', error);
            throw error;
        }
    }

    @Get('fecha')
    async findByFecha(@Query('fecha') fechaStr: string) {
        try {
            this.logger.debug(`Buscando reservas para la fecha: ${fechaStr}`);
            const fecha = new Date(fechaStr);

            if (isNaN(fecha.getTime())) {
                throw new BadRequestException('Formato de fecha inválido');
            }

            const reservas = await this.reservasService.findByFecha(fecha);
            this.logger.debug(`Encontradas ${reservas.length} reservas`);
            return reservas;
        } catch (error) {
            this.logger.error('Error al buscar reservas por fecha:', error);
            throw error;
        }
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        this.logger.debug(`Recibida petición para obtener reserva con ID: ${id}`);
        try {
            return await this.reservasService.findOne(id);
        } catch (error) {
            this.logger.error(`Error al obtener reserva con ID ${id}:`, error);
            throw error;
        }
    }

    @Patch(':id')
    @Roles(UserRole.ADMINISTRADOR, UserRole.TRABAJADOR)
    async update(@Param('id') id: string, @Body() updateReservaDto: UpdateReservaDto, @GetUser() user: User) {
        this.logger.debug(`Recibida petición para actualizar reserva con ID: ${id}`);
        try {
            return await this.reservasService.update(id, updateReservaDto, user._id.toString());
        } catch (error) {
            this.logger.error(`Error al actualizar reserva con ID ${id}:`, error);
            throw error;
        }
    }

    @Delete(':id')
    @Roles(UserRole.ADMINISTRADOR)
    async remove(@Param('id') id: string) {
        this.logger.debug(`Recibida petición para eliminar reserva con ID: ${id}`);
        try {
            await this.reservasService.remove(id);
            return { message: 'Reserva eliminada exitosamente' };
        } catch (error) {
            this.logger.error(`Error al eliminar reserva con ID ${id}:`, error);
            throw error;
        }
    }

    @Post(':id/liquidar')
    @Roles(UserRole.ADMINISTRADOR, UserRole.TRABAJADOR)
    async liquidar(@Param('id') id: string, @Body() liquidarReservaDto: LiquidarReservaDto, @GetUser() user: User) {
        this.logger.debug(`Recibida petición para liquidar reserva con ID: ${id}`);
        try {
            return await this.reservasService.liquidar(id, liquidarReservaDto, user._id.toString());
        } catch (error) {
            this.logger.error(`Error al liquidar reserva con ID ${id}:`, error);
            throw error;
        }
    }

    @Post(':id/cancelar')
    @Roles(UserRole.ADMINISTRADOR, UserRole.TRABAJADOR)
    async cancelar(@Param('id') id: string, @Body() cancelarReservaDto: CancelarReservaDto, @GetUser() user: User) {
        this.logger.debug(`Recibida petición para cancelar reserva con ID: ${id}`);
        try {
            return await this.reservasService.cancelar(id, cancelarReservaDto, user._id.toString());
        } catch (error) {
            this.logger.error(`Error al cancelar reserva con ID ${id}:`, error);
            throw error;
        }
    }
} 