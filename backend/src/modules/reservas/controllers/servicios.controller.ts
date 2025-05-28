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
@Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA, UserRole.TRABAJADOR)
export class ServiciosController {
    private readonly logger = new Logger(ServiciosController.name);

    constructor(private readonly serviciosService: ServiciosService) { }

    // Suplementos
    @Post('suplementos')
    @Roles(UserRole.ADMINISTRADOR)
    async createSuplemento(@Body() createSuplementoDto: CreateSuplementoDto) {
        this.logger.debug('Recibida petición para crear suplemento');
        try {
            return await this.serviciosService.createSuplemento(createSuplementoDto);
        } catch (error) {
            this.logger.error('Error al crear suplemento:', error);
            throw error;
        }
    }

    @Get('suplementos')
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA, UserRole.TRABAJADOR)
    async findAllSuplementos() {
        this.logger.debug('Recibida petición para obtener todos los suplementos');
        try {
            return await this.serviciosService.findAllSuplementos();
        } catch (error) {
            this.logger.error('Error al obtener suplementos:', error);
            throw error;
        }
    }

    @Get('suplementos/:id')
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA, UserRole.TRABAJADOR)
    async findOneSuplemento(@Param('id') id: string) {
        this.logger.debug(`Recibida petición para obtener suplemento con ID: ${id}`);
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
        this.logger.debug(`Recibida petición para actualizar suplemento con ID: ${id}`);
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
        this.logger.debug(`Recibida petición para eliminar suplemento con ID: ${id}`);
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
        this.logger.debug('Recibida petición para crear servicio');
        try {
            return await this.serviciosService.createServicio(createServicioDto);
        } catch (error) {
            this.logger.error('Error al crear servicio:', error);
            throw error;
        }
    }

    @Get()
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA, UserRole.TRABAJADOR)
    async findAllServicios() {
        this.logger.debug('Recibida petición para obtener todos los servicios');
        try {
            return await this.serviciosService.findAllServicios();
        } catch (error) {
            this.logger.error('Error al obtener servicios:', error);
            throw error;
        }
    }

    @Get(':id')
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA, UserRole.TRABAJADOR)
    async findOneServicio(@Param('id') id: string) {
        this.logger.debug(`Recibida petición para obtener servicio con ID: ${id}`);
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
        this.logger.debug(`Recibida petición para actualizar servicio con ID: ${id}`);
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
        this.logger.debug(`Recibida petición para eliminar servicio con ID: ${id}`);
        try {
            await this.serviciosService.removeServicio(id);
            return { message: 'Servicio eliminado exitosamente' };
        } catch (error) {
            this.logger.error(`Error al eliminar servicio con ID ${id}:`, error);
            throw error;
        }
    }
} 