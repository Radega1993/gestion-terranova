import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Logger } from '@nestjs/common';
import { ServiciosService } from '../services/servicios.service';
import { CreateServicioDto, UpdateServicioDto } from '../dto/servicio.dto';
import { CreateSuplementoDto, UpdateSuplementoDto } from '../dto/suplemento.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../users/types/user-roles.enum';

@Controller('servicios')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ServiciosController {
    private readonly logger = new Logger(ServiciosController.name);

    constructor(private readonly serviciosService: ServiciosService) { }

    // Suplementos
    @Post('suplementos')
    @Roles(UserRole.ADMINISTRADOR)
    async createSuplemento(@Body() createSuplementoDto: CreateSuplementoDto) {
        try {
            return await this.serviciosService.createSuplemento(createSuplementoDto);
        } catch (error) {
            this.logger.error('Error al crear suplemento:', error);
            throw error;
        }
    }

    @Get('suplementos')
    async findAllSuplementos() {
        try {
            const suplementos = await this.serviciosService.findAllSuplementos();
            return suplementos;
        } catch (error) {
            this.logger.error('Error al obtener suplementos:', error);
            throw error;
        }
    }

    @Get('suplementos/:id')
    async findOneSuplemento(@Param('id') id: string) {
        try {
            return await this.serviciosService.findOneSuplemento(id);
        } catch (error) {
            this.logger.error(`Error al obtener suplemento con ID ${id}:`, error);
            throw error;
        }
    }

    @Patch('suplementos/:id')
    @Roles(UserRole.ADMINISTRADOR)
    async updateSuplemento(@Param('id') id: string, @Body() updateSuplementoDto: UpdateSuplementoDto) {
        try {
            return await this.serviciosService.updateSuplemento(id, updateSuplementoDto);
        } catch (error) {
            this.logger.error(`Error al actualizar suplemento con ID ${id}:`, error);
            throw error;
        }
    }

    @Delete('suplementos/:id')
    @Roles(UserRole.ADMINISTRADOR)
    async removeSuplemento(@Param('id') id: string) {
        try {
            await this.serviciosService.removeSuplemento(id);
            return { message: 'Suplemento eliminado exitosamente' };
        } catch (error) {
            this.logger.error(`Error al eliminar suplemento con ID ${id}:`, error);
            throw error;
        }
    }

    // Servicios
    @Post()
    @Roles(UserRole.ADMINISTRADOR)
    async createServicio(@Body() createServicioDto: CreateServicioDto) {
        try {
            return await this.serviciosService.createServicio(createServicioDto);
        } catch (error) {
            this.logger.error('Error al crear servicio:', error);
            throw error;
        }
    }

    @Get()
    async findAllServicios() {
        try {
            return await this.serviciosService.findAllServicios();
        } catch (error) {
            this.logger.error('Error al obtener servicios:', error);
            throw error;
        }
    }

    @Get(':id')
    async findOneServicio(@Param('id') id: string) {
        try {
            return await this.serviciosService.findOneServicio(id);
        } catch (error) {
            this.logger.error(`Error al obtener servicio con ID ${id}:`, error);
            throw error;
        }
    }

    @Patch(':id')
    @Roles(UserRole.ADMINISTRADOR)
    async updateServicio(@Param('id') id: string, @Body() updateServicioDto: UpdateServicioDto) {
        try {
            return await this.serviciosService.updateServicio(id, updateServicioDto);
        } catch (error) {
            this.logger.error(`Error al actualizar servicio con ID ${id}:`, error);
            throw error;
        }
    }

    @Delete(':id')
    @Roles(UserRole.ADMINISTRADOR)
    async removeServicio(@Param('id') id: string) {
        try {
            await this.serviciosService.removeServicio(id);
            return { message: 'Servicio eliminado exitosamente' };
        } catch (error) {
            this.logger.error(`Error al eliminar servicio con ID ${id}:`, error);
            throw error;
        }
    }
} 