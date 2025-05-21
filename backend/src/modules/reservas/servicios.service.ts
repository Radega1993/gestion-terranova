import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Servicio } from './schemas/servicio.schema';
import { Suplemento } from './schemas/suplemento.schema';
import { CreateServicioDto, UpdateServicioDto } from './dto/servicio.dto';
import { CreateSuplementoDto, UpdateSuplementoDto } from './dto/suplemento.dto';

@Injectable()
export class ServiciosService {
    private readonly logger = new Logger(ServiciosService.name);

    constructor(
        @InjectModel(Servicio.name) private servicioModel: Model<Servicio>,
        @InjectModel(Suplemento.name) private suplementoModel: Model<Suplemento>
    ) { }

    // Servicios
    async createServicio(createServicioDto: CreateServicioDto): Promise<Servicio> {
        this.logger.debug('Intentando crear servicio con datos:', JSON.stringify(createServicioDto, null, 2));

        try {
            const servicioExistente = await this.servicioModel.findOne({ id: createServicioDto.id });
            if (servicioExistente) {
                this.logger.warn(`Ya existe un servicio con el ID: ${createServicioDto.id}`);
                throw new BadRequestException('Ya existe un servicio con ese ID');
            }

            const servicio = new this.servicioModel(createServicioDto);
            const servicioGuardado = await servicio.save();
            this.logger.debug('Servicio creado exitosamente:', JSON.stringify(servicioGuardado, null, 2));
            return servicioGuardado;
        } catch (error) {
            this.logger.error('Error al crear servicio:', error);
            throw error;
        }
    }

    async findAllServicios(): Promise<Servicio[]> {
        this.logger.debug('Buscando todos los servicios');
        try {
            const servicios = await this.servicioModel.find().exec();
            this.logger.debug(`Se encontraron ${servicios.length} servicios`);
            return servicios;
        } catch (error) {
            this.logger.error('Error al buscar servicios:', error);
            throw error;
        }
    }

    async findOneServicio(id: string): Promise<Servicio> {
        this.logger.debug(`Buscando servicio con ID: ${id}`);
        try {
            const servicio = await this.servicioModel.findOne({ id }).exec();
            if (!servicio) {
                this.logger.warn(`Servicio con ID ${id} no encontrado`);
                throw new NotFoundException(`Servicio con ID ${id} no encontrado`);
            }
            this.logger.debug('Servicio encontrado:', JSON.stringify(servicio, null, 2));
            return servicio;
        } catch (error) {
            this.logger.error(`Error al buscar servicio con ID ${id}:`, error);
            throw error;
        }
    }

    async updateServicio(id: string, updateServicioDto: UpdateServicioDto): Promise<Servicio> {
        this.logger.debug(`Intentando actualizar servicio con ID: ${id}`);
        this.logger.debug('Datos de actualización:', JSON.stringify(updateServicioDto, null, 2));

        try {
            const servicio = await this.servicioModel.findOneAndUpdate(
                { id },
                updateServicioDto,
                { new: true }
            ).exec();

            if (!servicio) {
                this.logger.warn(`Servicio con ID ${id} no encontrado para actualizar`);
                throw new NotFoundException(`Servicio con ID ${id} no encontrado`);
            }

            this.logger.debug('Servicio actualizado exitosamente:', JSON.stringify(servicio, null, 2));
            return servicio;
        } catch (error) {
            this.logger.error(`Error al actualizar servicio con ID ${id}:`, error);
            throw error;
        }
    }

    async removeServicio(id: string): Promise<void> {
        this.logger.debug(`Intentando eliminar servicio con ID: ${id}`);
        try {
            const result = await this.servicioModel.deleteOne({ id }).exec();
            if (result.deletedCount === 0) {
                this.logger.warn(`Servicio con ID ${id} no encontrado para eliminar`);
                throw new NotFoundException(`Servicio con ID ${id} no encontrado`);
            }
            this.logger.debug(`Servicio con ID ${id} eliminado exitosamente`);
        } catch (error) {
            this.logger.error(`Error al eliminar servicio con ID ${id}:`, error);
            throw error;
        }
    }

    // Alias para el controlador
    findAll() { return this.findAllServicios(); }
    findOne(id: string) { return this.findOneServicio(id); }
    create(dto: CreateServicioDto) { return this.createServicio(dto); }
    update(id: string, dto: UpdateServicioDto) { return this.updateServicio(id, dto); }
    remove(id: string) { return this.removeServicio(id); }

    // Suplementos
    async createSuplemento(createSuplementoDto: CreateSuplementoDto): Promise<Suplemento> {
        this.logger.debug('Intentando crear suplemento con datos:', JSON.stringify(createSuplementoDto, null, 2));
        try {
            const suplemento = new this.suplementoModel(createSuplementoDto);
            const suplementoGuardado = await suplemento.save();
            this.logger.debug('Suplemento creado exitosamente:', JSON.stringify(suplementoGuardado, null, 2));
            return suplementoGuardado;
        } catch (error) {
            this.logger.error('Error al crear suplemento:', error);
            throw error;
        }
    }

    async findAllSuplementos(): Promise<Suplemento[]> {
        this.logger.debug('Buscando todos los suplementos');
        try {
            const suplementos = await this.suplementoModel.find().exec();
            this.logger.debug(`Se encontraron ${suplementos.length} suplementos`);
            return suplementos;
        } catch (error) {
            this.logger.error('Error al buscar suplementos:', error);
            throw error;
        }
    }

    async findOneSuplemento(id: string): Promise<Suplemento> {
        this.logger.debug(`Buscando suplemento con ID: ${id}`);
        try {
            const suplemento = await this.suplementoModel.findById(id).exec();
            if (!suplemento) {
                this.logger.warn(`Suplemento con ID ${id} no encontrado`);
                throw new NotFoundException(`Suplemento con ID ${id} no encontrado`);
            }
            this.logger.debug('Suplemento encontrado:', JSON.stringify(suplemento, null, 2));
            return suplemento;
        } catch (error) {
            this.logger.error(`Error al buscar suplemento con ID ${id}:`, error);
            throw error;
        }
    }

    async updateSuplemento(id: string, updateSuplementoDto: UpdateSuplementoDto): Promise<Suplemento> {
        this.logger.debug(`Intentando actualizar suplemento con ID: ${id}`);
        this.logger.debug('Datos de actualización:', JSON.stringify(updateSuplementoDto, null, 2));

        try {
            const suplemento = await this.suplementoModel.findByIdAndUpdate(
                id,
                updateSuplementoDto,
                { new: true }
            ).exec();

            if (!suplemento) {
                this.logger.warn(`Suplemento con ID ${id} no encontrado para actualizar`);
                throw new NotFoundException(`Suplemento con ID ${id} no encontrado`);
            }

            this.logger.debug('Suplemento actualizado exitosamente:', JSON.stringify(suplemento, null, 2));
            return suplemento;
        } catch (error) {
            this.logger.error(`Error al actualizar suplemento con ID ${id}:`, error);
            throw error;
        }
    }

    async removeSuplemento(id: string): Promise<void> {
        this.logger.debug(`Intentando eliminar suplemento con ID: ${id}`);
        try {
            const result = await this.suplementoModel.findByIdAndDelete(id).exec();
            if (!result) {
                this.logger.warn(`Suplemento con ID ${id} no encontrado para eliminar`);
                throw new NotFoundException(`Suplemento con ID ${id} no encontrado`);
            }
            this.logger.debug(`Suplemento con ID ${id} eliminado exitosamente`);
        } catch (error) {
            this.logger.error(`Error al eliminar suplemento con ID ${id}:`, error);
            throw error;
        }
    }
} 