import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Logger } from '@nestjs/common';
import { ServiciosService } from './servicios.service';
import { CreateServicioDto, UpdateServicioDto } from './dto/servicio.dto';
import { CreateSuplementoDto, UpdateSuplementoDto } from './dto/suplemento.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/types/user-roles.enum';

@Controller('servicios')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ServiciosController {
    private readonly logger = new Logger(ServiciosController.name);

    constructor(private readonly serviciosService: ServiciosService) { }

    // Suplementos - Rutas específicas primero
    @Post('suplementos')
    @Roles(UserRole.ADMINISTRADOR)
    async createSuplemento(@Body() createSuplementoDto: CreateSuplementoDto) {
        this.logger.debug('Recibida petición para crear suplemento');
        this.logger.debug('Datos recibidos:', JSON.stringify(createSuplementoDto, null, 2));
        try {
            const result = await this.serviciosService.createSuplemento(createSuplementoDto);
            this.logger.debug('Suplemento creado exitosamente:', JSON.stringify(result, null, 2));
            return result;
        } catch (error) {
            this.logger.error('Error al crear suplemento:', error);
            throw error;
        }
    }

    @Get('suplementos')
    async findAllSuplementos() {
        this.logger.debug('Recibida petición para obtener todos los suplementos');
        try {
            const result = await this.serviciosService.findAllSuplementos();
            this.logger.debug(`Se encontraron ${result.length} suplementos`);
            return result;
        } catch (error) {
            this.logger.error('Error al obtener suplementos:', error);
            throw error;
        }
    }

    @Get('suplementos/:id')
    async findOneSuplemento(@Param('id') id: string) {
        this.logger.debug(`Recibida petición para obtener suplemento con ID: ${id}`);
        try {
            const result = await this.serviciosService.findOneSuplemento(id);
            this.logger.debug('Suplemento encontrado:', JSON.stringify(result, null, 2));
            return result;
        } catch (error) {
            this.logger.error(`Error al obtener suplemento con ID ${id}:`, error);
            throw error;
        }
    }

    @Patch('suplementos/:id')
    @Roles(UserRole.ADMINISTRADOR)
    async updateSuplemento(@Param('id') id: string, @Body() updateSuplementoDto: UpdateSuplementoDto) {
        this.logger.debug(`Recibida petición para actualizar suplemento con ID: ${id}`);
        this.logger.debug('Datos de actualización:', JSON.stringify(updateSuplementoDto, null, 2));
        try {
            const result = await this.serviciosService.updateSuplemento(id, updateSuplementoDto);
            this.logger.debug('Suplemento actualizado exitosamente:', JSON.stringify(result, null, 2));
            return result;
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
            this.logger.debug(`Suplemento con ID ${id} eliminado exitosamente`);
            return { message: 'Suplemento eliminado exitosamente' };
        } catch (error) {
            this.logger.error(`Error al eliminar suplemento con ID ${id}:`, error);
            throw error;
        }
    }

    // Servicios - Rutas con parámetros después
    @Post()
    @Roles(UserRole.ADMINISTRADOR)
    async createServicio(@Body() createServicioDto: CreateServicioDto) {
        this.logger.debug('Recibida petición para crear servicio');
        this.logger.debug('Datos recibidos:', JSON.stringify(createServicioDto, null, 2));
        try {
            const result = await this.serviciosService.createServicio(createServicioDto);
            this.logger.debug('Servicio creado exitosamente:', JSON.stringify(result, null, 2));
            return result;
        } catch (error) {
            this.logger.error('Error al crear servicio:', error);
            throw error;
        }
    }

    @Get()
    async findAllServicios() {
        this.logger.debug('Recibida petición para obtener todos los servicios');
        try {
            const result = await this.serviciosService.findAllServicios();
            this.logger.debug(`Se encontraron ${result.length} servicios`);
            return result;
        } catch (error) {
            this.logger.error('Error al obtener servicios:', error);
            throw error;
        }
    }

    @Get(':id')
    async findOneServicio(@Param('id') id: string) {
        this.logger.debug(`Recibida petición para obtener servicio con ID: ${id}`);
        try {
            const result = await this.serviciosService.findOneServicio(id);
            this.logger.debug('Servicio encontrado:', JSON.stringify(result, null, 2));
            return result;
        } catch (error) {
            this.logger.error(`Error al obtener servicio con ID ${id}:`, error);
            throw error;
        }
    }

    @Patch(':id')
    @Roles(UserRole.ADMINISTRADOR)
    async updateServicio(@Param('id') id: string, @Body() updateServicioDto: UpdateServicioDto) {
        this.logger.debug(`Recibida petición para actualizar servicio con ID: ${id}`);
        this.logger.debug('Datos de actualización:', JSON.stringify(updateServicioDto, null, 2));
        try {
            const result = await this.serviciosService.updateServicio(id, updateServicioDto);
            this.logger.debug('Servicio actualizado exitosamente:', JSON.stringify(result, null, 2));
            return result;
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
            this.logger.debug(`Servicio con ID ${id} eliminado exitosamente`);
            return { message: 'Servicio eliminado exitosamente' };
        } catch (error) {
            this.logger.error(`Error al eliminar servicio con ID ${id}:`, error);
            throw error;
        }
    }
} 