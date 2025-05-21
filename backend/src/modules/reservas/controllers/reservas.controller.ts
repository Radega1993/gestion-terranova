import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards } from '@nestjs/common';
import { ReservasService } from '../services/reservas.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../users/types/user-roles.enum';

@Controller('reservas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReservasController {
    constructor(private readonly reservasService: ReservasService) { }

    @Get()
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA, UserRole.TRABAJADOR)
    async findAll() {
        return this.reservasService.findAll();
    }

    @Get(':id')
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA, UserRole.TRABAJADOR)
    async findOne(@Param('id') id: string) {
        return this.reservasService.findOne(id);
    }

    @Post()
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA, UserRole.TRABAJADOR)
    async create(@Body() createReservaDto: any) {
        return this.reservasService.create(createReservaDto);
    }

    @Put(':id')
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA)
    async update(@Param('id') id: string, @Body() updateReservaDto: any) {
        return this.reservasService.update(id, updateReservaDto);
    }

    @Delete(':id')
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA)
    async remove(@Param('id') id: string) {
        return this.reservasService.remove(id);
    }
} 