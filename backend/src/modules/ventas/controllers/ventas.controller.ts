import { Controller, Post, Get, Body, UseGuards, Request, Logger, Query, Param } from '@nestjs/common';
import { VentasService } from '../services/ventas.service';
import { CreateVentaDto } from '../dto/create-venta.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../auth/enums/user-role.enum';
import { VentaFiltersDto } from '../dto/venta-filters.dto';
import { PagoVentaDto } from '../dto/pago-venta.dto';

@Controller('ventas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VentasController {
    private readonly logger = new Logger(VentasController.name);

    constructor(private readonly ventasService: VentasService) { }

    @Get()
    @Roles(UserRole.ADMINISTRADOR, UserRole.TRABAJADOR)
    async findAll(@Query() filters: VentaFiltersDto) {
        this.logger.debug('Obteniendo todas las ventas');
        return this.ventasService.findAll(filters);
    }

    @Get('cliente/:codigo')
    @Roles(UserRole.ADMINISTRADOR, UserRole.TRABAJADOR)
    async findByCliente(
        @Param('codigo') codigo: string,
        @Query() filters: VentaFiltersDto
    ) {
        this.logger.debug(`Obteniendo ventas del cliente ${codigo}`);
        return this.ventasService.findByCliente(codigo, filters);
    }

    @Get('usuario')
    @Roles(UserRole.ADMINISTRADOR, UserRole.TRABAJADOR)
    async findByUsuario(
        @Request() req,
        @Query() filters: VentaFiltersDto
    ) {
        this.logger.debug(`Obteniendo ventas del usuario ${req.user._id}`);
        return this.ventasService.findByUsuario(req.user._id, filters);
    }

    @Get('pendientes')
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA)
    findPendientes(
        @Query('fechaInicio') fechaInicio?: string,
        @Query('fechaFin') fechaFin?: string,
        @Query('codigoCliente') codigoCliente?: string,
        @Query('estado') estado?: string,
    ) {
        return this.ventasService.findPendientes({
            fechaInicio,
            fechaFin,
            codigoCliente,
            estado,
        });
    }

    @Post()
    @Roles(UserRole.ADMINISTRADOR, UserRole.TRABAJADOR)
    async create(@Body() createVentaDto: CreateVentaDto, @Request() req) {
        this.logger.debug('Creando nueva venta');
        return this.ventasService.create(createVentaDto, req.user._id);
    }

    @Post(':id/pago')
    @Roles(UserRole.ADMINISTRADOR, UserRole.TRABAJADOR)
    async registrarPago(
        @Param('id') id: string,
        @Body() pagoVentaDto: PagoVentaDto,
    ) {
        return this.ventasService.registrarPago(id, pagoVentaDto);
    }

    @Get('recaudaciones')
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA)
    async getRecaudaciones(
        @Query('fechaInicio') fechaInicio?: string,
        @Query('fechaFin') fechaFin?: string,
        @Query('codigoSocio') codigoSocio?: string,
        @Query('usuario') usuario?: string,
    ) {
        this.logger.debug('Obteniendo recaudaciones');
        return this.ventasService.getRecaudaciones({
            fechaInicio,
            fechaFin,
            codigoSocio,
            usuario,
        });
    }
} 