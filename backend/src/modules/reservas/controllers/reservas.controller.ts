import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, UnauthorizedException, Logger, BadRequestException, Request, Res } from '@nestjs/common';
import { ReservasService } from '../services/reservas.service';
import { CreateReservaDto } from '../dto/create-reserva.dto';
import { UpdateReservaDto } from '../dto/update-reserva.dto';
import { LiquidarReservaDto } from '../dto/liquidar-reserva.dto';
import { CancelarReservaDto } from '../dto/cancelar-reserva.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import { User } from '../../users/schemas/user.schema';
import { UserRole } from '../../users/types/user-roles.enum';
import { Reserva } from '../schemas/reserva.schema';
import { Response } from 'express';
import * as ExcelJS from 'exceljs';

@Controller('reservas')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA, UserRole.TRABAJADOR, UserRole.TIENDA)
export class ReservasController {
    private readonly logger = new Logger(ReservasController.name);

    constructor(private readonly reservasService: ReservasService) { }

    @Post()
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA, UserRole.TRABAJADOR, UserRole.TIENDA)
    create(@Body() createReservaDto: CreateReservaDto, @Request() req) {
        try {
            return this.reservasService.create(createReservaDto, req.user._id, req.user.role);
        } catch (error) {
            this.logger.error('Error al crear reserva:', error);
            throw error;
        }
    }

    @Get()
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA, UserRole.TRABAJADOR, UserRole.TIENDA)
    async findAll() {
        try {
            const reservas = await this.reservasService.findAll();
            return reservas;
        } catch (error) {
            this.logger.error('Error al obtener reservas:', error);
            throw error;
        }
    }

    @Get('usuario/:usuarioId')
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA, UserRole.TRABAJADOR, UserRole.TIENDA)
    async findByUsuario(@Param('usuarioId') usuarioId: string) {
        try {
            const reservas = await this.reservasService.findByUsuario(usuarioId);
            return reservas;
        } catch (error) {
            this.logger.error('Error al buscar reservas por usuario:', error);
            throw error;
        }
    }

    @Get('fecha')
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA, UserRole.TRABAJADOR, UserRole.TIENDA)
    async findByFecha(@Query('fecha') fechaStr: string) {
        try {
            const fecha = new Date(fechaStr);

            if (isNaN(fecha.getTime())) {
                throw new BadRequestException('Formato de fecha inválido');
            }

            const reservas = await this.reservasService.findByFecha(fecha);
            return reservas;
        } catch (error) {
            this.logger.error('Error al buscar reservas por fecha:', error);
            throw error;
        }
    }

    @Get(':id')
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA, UserRole.TRABAJADOR, UserRole.TIENDA)
    findOne(@Param('id') id: string) {
        try {
            return this.reservasService.findOne(id);
        } catch (error) {
            this.logger.error(`Error al obtener reserva con ID ${id}:`, error);
            throw error;
        }
    }

    @Patch(':id')
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA, UserRole.TIENDA)
    update(@Param('id') id: string, @Body() updateReservaDto: UpdateReservaDto, @Request() req) {
        try {
            return this.reservasService.update(id, updateReservaDto, req.user._id);
        } catch (error) {
            this.logger.error(`Error al actualizar reserva con ID ${id}:`, error);
            throw error;
        }
    }

    @Delete(':id')
    @Roles(UserRole.ADMINISTRADOR)
    async remove(@Param('id') id: string) {
        try {
            await this.reservasService.remove(id);
            return { message: 'Reserva eliminada exitosamente' };
        } catch (error) {
            this.logger.error(`Error al eliminar reserva con ID ${id}:`, error);
            throw error;
        }
    }

    @Post(':id/cancelar')
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA, UserRole.TRABAJADOR, UserRole.TIENDA)
    cancelar(@Param('id') id: string, @Body() cancelarReservaDto: CancelarReservaDto, @Request() req) {
        try {
            return this.reservasService.cancelar(id, cancelarReservaDto, req.user._id);
        } catch (error) {
            this.logger.error(`Error al cancelar reserva con ID ${id}:`, error);
            throw error;
        }
    }

    // @Post(':id/completar')
    // @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA, UserRole.TRABAJADOR)
    // completar(@Param('id') id: string) {
    //     return this.reservasService.completar(id);
    // }

    @Post(':id/liquidar')
    @Patch(':id/liquidar')
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA, UserRole.TRABAJADOR, UserRole.TIENDA)
    async liquidar(
        @Param('id') id: string,
        @Body() liquidarReservaDto: LiquidarReservaDto,
        @Request() req
    ): Promise<Reserva> {
        try {
            return this.reservasService.liquidar(id, liquidarReservaDto, req.user._id);
        } catch (error) {
            this.logger.error(`Error al liquidar reserva con ID ${id}:`, error);
            throw error;
        }
    }

    @Get('export')
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA, UserRole.TRABAJADOR, UserRole.TIENDA)
    async exportReservas(@Res() res: Response) {
        try {
            const reservas = await this.reservasService.findAll();
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Reservas');

            // Add headers
            worksheet.columns = [
                { header: 'ID', key: 'id', width: 15 },
                { header: 'Fecha', key: 'fecha', width: 15 },
                { header: 'Instalación', key: 'instalacion', width: 20 },
                { header: 'Socio', key: 'socio', width: 30 },
                { header: 'Código Socio', key: 'codigoSocio', width: 15 },
                { header: 'Estado', key: 'estado', width: 15 },
                { header: 'Precio', key: 'precio', width: 12 },
                { header: 'Monto Abonado', key: 'montoAbonado', width: 15 },
                { header: 'Pendiente', key: 'pendiente', width: 12 },
                { header: 'Método Pago', key: 'metodoPago', width: 15 },
                { header: 'Usuario Creación', key: 'usuarioCreacion', width: 20 },
                { header: 'Trabajador', key: 'trabajador', width: 20 },
                { header: 'Observaciones', key: 'observaciones', width: 30 },
                { header: 'Normativa Aceptada', key: 'normativaAceptada', width: 18 },
                { header: 'Fecha Aceptación Normativa', key: 'fechaAceptacionNormativa', width: 25 }
            ];

            // Style the header row
            worksheet.getRow(1).font = { bold: true };
            worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

            // Add data
            reservas.forEach((reserva: any) => {
                const socio = reserva.socio?.nombre ? 
                    `${reserva.socio.nombre.nombre} ${reserva.socio.nombre.primerApellido} ${reserva.socio.nombre.segundoApellido || ''}`.trim() : 
                    'N/A';
                const codigoSocio = reserva.socio?.socio || 'N/A';
                const usuarioCreacion = reserva.usuarioCreacion?.username || 'N/A';
                const trabajador = reserva.trabajador ? 
                    `${reserva.trabajador.nombre} (${reserva.trabajador.identificador})` : 
                    'N/A';
                const pendiente = reserva.precio - (reserva.montoAbonado || 0);

                worksheet.addRow({
                    id: reserva._id,
                    fecha: reserva.fecha ? new Date(reserva.fecha).toLocaleDateString('es-ES') : '',
                    instalacion: reserva.tipoInstalacion || '',
                    socio: socio,
                    codigoSocio: codigoSocio,
                    estado: reserva.estado || '',
                    precio: reserva.precio || 0,
                    montoAbonado: reserva.montoAbonado || 0,
                    pendiente: pendiente,
                    metodoPago: reserva.metodoPago || '',
                    usuarioCreacion: usuarioCreacion,
                    trabajador: trabajador,
                    observaciones: reserva.observaciones || '',
                    normativaAceptada: reserva.normativaAceptada ? 'Sí' : 'No',
                    fechaAceptacionNormativa: reserva.fechaAceptacionNormativa ? 
                        new Date(reserva.fechaAceptacionNormativa).toLocaleDateString('es-ES') : ''
                });
            });

            // Set response headers
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=reservas.xlsx');

            // Send the file
            await workbook.xlsx.write(res);
            res.end();
        } catch (error) {
            this.logger.error('Error al exportar reservas:', error);
            throw error;
        }
    }
} 