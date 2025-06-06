import { Controller, Get, Post, Body, Param, Query, UseGuards, Put, Request } from '@nestjs/common';
import { InvitacionesService } from '../services/invitaciones.service';
import { CreateInvitacionDto } from '../dto/create-invitacion.dto';
import { UpdateInvitacionesDto } from '../dto/update-invitaciones.dto';
import { InvitacionesFiltersDto } from '../dto/invitaciones-filters.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../auth/enums/user-role.enum';

@Controller('invitaciones')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InvitacionesController {
    constructor(private readonly invitacionesService: InvitacionesService) { }

    @Post()
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA)
    create(@Body() createInvitacionDto: CreateInvitacionDto, @Request() req) {
        return this.invitacionesService.create(createInvitacionDto, req.user.userId);
    }

    @Get()
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA, UserRole.TRABAJADOR)
    findAll(@Query() filters: InvitacionesFiltersDto) {
        return this.invitacionesService.findAll(filters);
    }

    @Put(':codigoSocio/actualizar')
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA)
    updateInvitacionesSocio(
        @Param('codigoSocio') codigoSocio: string,
        @Body() updateInvitacionesDto: UpdateInvitacionesDto,
        @Request() req
    ) {
        return this.invitacionesService.updateInvitacionesSocio(
            codigoSocio,
            updateInvitacionesDto,
            req.user.userId
        );
    }

    @Get(':codigoSocio/disponibles')
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA, UserRole.TRABAJADOR)
    getInvitacionesDisponibles(@Param('codigoSocio') codigoSocio: string) {
        return this.invitacionesService.getInvitacionesDisponibles(codigoSocio);
    }

    @Get('resumen/:ejercicio')
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA, UserRole.TRABAJADOR)
    getResumenEjercicio(@Param('ejercicio') ejercicio: string) {
        return this.invitacionesService.getResumenEjercicio(parseInt(ejercicio));
    }
} 