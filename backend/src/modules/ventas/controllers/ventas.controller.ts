import { Controller, Post, Get, Put, Body, UseGuards, Request, Logger, Query, Param } from '@nestjs/common';
import { VentasService } from '../services/ventas.service';
import { CreateVentaDto } from '../dto/create-venta.dto';
import { UpdateVentaDto } from '../dto/update-venta.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../users/types/user-roles.enum';
import { VentaFiltersDto } from '../dto/venta-filters.dto';
import { PagoVentaDto } from '../dto/pago-venta.dto';
import { RecaudacionesFiltrosDto } from '../dto/recaudaciones-filtros.dto';

@Controller('ventas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VentasController {
    private readonly logger = new Logger(VentasController.name);

    constructor(private readonly ventasService: VentasService) { }

    @Get()
    @Roles(UserRole.ADMINISTRADOR, UserRole.TRABAJADOR, UserRole.JUNTA, UserRole.TIENDA)
    async findAll(@Query() filters: VentaFiltersDto) {
        return this.ventasService.findAll(filters);
    }

    @Get('cliente/:codigo')
    @Roles(UserRole.ADMINISTRADOR, UserRole.TRABAJADOR, UserRole.JUNTA, UserRole.TIENDA)
    async findByCliente(
        @Param('codigo') codigo: string,
        @Query() filters: VentaFiltersDto
    ) {
        return this.ventasService.findByCliente(codigo, filters);
    }

    @Get('usuario')
    @Roles(UserRole.ADMINISTRADOR, UserRole.TRABAJADOR, UserRole.JUNTA, UserRole.TIENDA)
    async findByUsuario(
        @Request() req,
        @Query() filters: VentaFiltersDto
    ) {
        return this.ventasService.findByUsuario(req.user._id, filters);
    }

    @Get('pendientes')
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA, UserRole.TRABAJADOR, UserRole.TIENDA)
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
    @Roles(UserRole.ADMINISTRADOR, UserRole.TRABAJADOR, UserRole.JUNTA, UserRole.TIENDA)
    async create(@Body() createVentaDto: CreateVentaDto, @Request() req) {
        return this.ventasService.create(createVentaDto, req.user._id, req.user.role);
    }

    @Post(':id/pago')
    @Roles(UserRole.ADMINISTRADOR, UserRole.TRABAJADOR, UserRole.JUNTA, UserRole.TIENDA)
    async registrarPago(
        @Param('id') id: string,
        @Body() pagoVentaDto: PagoVentaDto,
        @Request() req,
    ) {
        return this.ventasService.registrarPago(id, pagoVentaDto, req.user._id, req.user.role);
    }

    @Get('recaudaciones')
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA, UserRole.TRABAJADOR, UserRole.TIENDA)
    async getRecaudaciones(@Query() filtros: RecaudacionesFiltrosDto) {
        return this.ventasService.getRecaudaciones(filtros);
    }

    @Put(':id')
    @Roles(UserRole.ADMINISTRADOR)
    async update(@Param('id') id: string, @Body() updateVentaDto: UpdateVentaDto) {
        return this.ventasService.update(id, updateVentaDto);
    }
} 