import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Servicio } from '../schemas/servicio.schema';
import { Suplemento } from '../schemas/suplemento.schema';
import { CreateServicioDto, UpdateServicioDto } from '../dto/servicio.dto';
import { CreateSuplementoDto, UpdateSuplementoDto } from '../dto/suplemento.dto';

@Injectable()
export class ServiciosService {
    private readonly logger = new Logger(ServiciosService.name);

    constructor(
        @InjectModel(Servicio.name) private servicioModel: Model<Servicio>,
        @InjectModel(Suplemento.name) private suplementoModel: Model<Suplemento>
    ) { }

    // Servicios
    async createServicio(createServicioDto: CreateServicioDto): Promise<Servicio> {
        try {
            // Verificar si ya existe un servicio con el mismo id
            const existingService = await this.servicioModel.findOne({ id: createServicioDto.id });
            if (existingService) {
                throw new BadRequestException(`Ya existe un servicio con el id ${createServicioDto.id}`);
            }

            const servicio = new this.servicioModel(createServicioDto);
            return await servicio.save();
        } catch (error) {
            this.logger.error('Error al crear servicio:', error);
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException('Error al crear el servicio');
        }
    }

    async findAllServicios(): Promise<Servicio[]> {
        try {
            return await this.servicioModel.find().exec();
        } catch (error) {
            this.logger.error('Error al obtener servicios:', error);
            throw new BadRequestException('Error al obtener los servicios');
        }
    }

    async findOneServicio(id: string): Promise<Servicio> {
        try {
            const servicio = await this.servicioModel.findById(id).exec();

            if (!servicio) {
                throw new NotFoundException(`Servicio con ID ${id} no encontrado`);
            }

            return servicio;
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            this.logger.error(`Error al obtener servicio con ID ${id}:`, error);
            throw new BadRequestException('Error al obtener el servicio');
        }
    }

    async updateServicio(id: string, updateServicioDto: UpdateServicioDto): Promise<Servicio> {
        try {
            const servicio = await this.servicioModel.findById(id);

            if (!servicio) {
                throw new NotFoundException(`Servicio con ID ${id} no encontrado`);
            }

            const servicioActualizado = await this.servicioModel.findByIdAndUpdate(
                id,
                updateServicioDto,
                { new: true }
            ).exec();

            return servicioActualizado;
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            this.logger.error(`Error al actualizar servicio con ID ${id}:`, error);
            throw new BadRequestException('Error al actualizar el servicio');
        }
    }

    async removeServicio(id: string): Promise<void> {
        try {
            const servicio = await this.servicioModel.findById(id);

            if (!servicio) {
                throw new NotFoundException(`Servicio con ID ${id} no encontrado`);
            }

            await this.servicioModel.findByIdAndDelete(id);
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            this.logger.error(`Error al eliminar servicio con ID ${id}:`, error);
            throw new BadRequestException('Error al eliminar el servicio');
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
        try {
            const suplemento = new this.suplementoModel(createSuplementoDto);
            return await suplemento.save();
        } catch (error) {
            this.logger.error('Error al crear suplemento:', error);
            throw new BadRequestException('Error al crear el suplemento');
        }
    }

    async findAllSuplementos(): Promise<Suplemento[]> {
        try {
            console.log('Iniciando búsqueda de suplementos en la base de datos...');
            const suplementos = await this.suplementoModel.find().exec();
            console.log('Suplementos encontrados en la base de datos:', JSON.stringify(suplementos, null, 2));
            return suplementos;
        } catch (error) {
            console.error('Error al buscar suplementos en la base de datos:', error);
            throw error;
        }
    }

    async findOneSuplemento(id: string): Promise<Suplemento> {
        try {
            const suplemento = await this.suplementoModel.findById(id).exec();

            if (!suplemento) {
                throw new NotFoundException(`Suplemento con ID ${id} no encontrado`);
            }

            return suplemento;
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            this.logger.error(`Error al obtener suplemento con ID ${id}:`, error);
            throw new BadRequestException('Error al obtener el suplemento');
        }
    }

    async updateSuplemento(id: string, updateSuplementoDto: UpdateSuplementoDto): Promise<Suplemento> {
        try {
            const suplemento = await this.suplementoModel.findById(id);

            if (!suplemento) {
                throw new NotFoundException(`Suplemento con ID ${id} no encontrado`);
            }

            const suplementoActualizado = await this.suplementoModel.findByIdAndUpdate(
                id,
                updateSuplementoDto,
                { new: true }
            ).exec();

            return suplementoActualizado;
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            this.logger.error(`Error al actualizar suplemento con ID ${id}:`, error);
            throw new BadRequestException('Error al actualizar el suplemento');
        }
    }

    async removeSuplemento(id: string): Promise<void> {
        try {
            const suplemento = await this.suplementoModel.findById(id);

            if (!suplemento) {
                throw new NotFoundException(`Suplemento con ID ${id} no encontrado`);
            }

            await this.suplementoModel.findByIdAndDelete(id);
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            this.logger.error(`Error al eliminar suplemento con ID ${id}:`, error);
            throw new BadRequestException('Error al eliminar el suplemento');
        }
    }
} 