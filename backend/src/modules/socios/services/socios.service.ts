import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Socio } from '../schemas/socio.schema';
import { CreateSocioDto } from '../dto/create-socio.dto';
import { UpdateSocioDto } from '../dto/update-socio.dto';
import { UploadsService } from '../../uploads/uploads.service';

@Injectable()
export class SociosService {
    private readonly logger = new Logger(SociosService.name);

    constructor(
        @InjectModel(Socio.name) private socioModel: Model<Socio>,
        private uploadsService: UploadsService
    ) { }

    async create(createSocioDto: CreateSocioDto): Promise<Socio> {
        try {
            this.logger.debug(`Creating new socio: ${JSON.stringify(createSocioDto)}`);
            const createdSocio = new this.socioModel(createSocioDto);
            return await createdSocio.save();
        } catch (error) {
            this.logger.error(`Error creating socio: ${error.message}`);
            throw error;
        }
    }

    async findAll(): Promise<Socio[]> {
        try {
            return await this.socioModel.find().exec();
        } catch (error) {
            this.logger.error(`Error finding all socios: ${error.message}`);
            throw error;
        }
    }

    async findOne(id: string): Promise<Socio> {
        try {
            const socio = await this.socioModel.findById(id).exec();
            if (!socio) {
                throw new NotFoundException(`Socio with ID ${id} not found`);
            }
            return socio;
        } catch (error) {
            this.logger.error(`Error finding socio ${id}: ${error.message}`);
            throw error;
        }
    }

    async update(id: string, updateSocioDto: UpdateSocioDto): Promise<Socio> {
        try {
            this.logger.debug(`Updating socio with ID: ${id}`);

            const socio = await this.socioModel.findById(id);
            if (!socio) {
                throw new NotFoundException(`Socio con ID ${id} no encontrado`);
            }

            // Si hay una nueva foto y existe una foto anterior, eliminarla
            if (updateSocioDto.foto && socio.foto) {
                try {
                    await this.uploadsService.deleteFile(socio.foto);
                } catch (error) {
                    this.logger.warn(`No se pudo eliminar la foto anterior: ${error.message}`);
                }
            }

            // Preparar los datos de actualización
            const updateData = { ...updateSocioDto };

            // Si se está actualizando la dirección, mantener los campos existentes que no se envían
            if (updateSocioDto.direccion) {
                updateData.direccion = {
                    ...socio.direccion,
                    ...updateSocioDto.direccion
                };
            }

            const socioActualizado = await this.socioModel.findByIdAndUpdate(
                id,
                updateData,
                { new: true }
            ).exec();

            return socioActualizado;
        } catch (error) {
            this.logger.error(`Error updating socio with ID ${id}:`, error);
            throw error;
        }
    }

    async remove(id: string): Promise<void> {
        try {
            const socio = await this.socioModel.findById(id).exec();
            if (!socio) {
                throw new NotFoundException(`Socio with ID ${id} not found`);
            }

            // Eliminar la imagen si existe
            if (socio.foto) {
                await this.uploadsService.deleteFile(socio.foto);
            }

            await this.socioModel.findByIdAndDelete(id).exec();
        } catch (error) {
            this.logger.error(`Error removing socio ${id}: ${error.message}`);
            throw error;
        }
    }

    async toggleActive(id: string): Promise<Socio> {
        this.logger.debug(`Toggling active status for socio with ID: ${id}`);
        const socio = await this.socioModel.findById(id).exec();
        if (!socio) {
            throw new NotFoundException(`Socio with ID ${id} not found`);
        }
        socio.isActive = !socio.isActive;
        return socio.save();
    }

    async addMiembroFamilia(socioId: string, miembroId: string): Promise<Socio> {
        this.logger.debug(`Adding miembro to socio with ID: ${socioId}`);
        const socio = await this.socioModel.findById(socioId);
        if (!socio) {
            throw new NotFoundException(`Socio con ID ${socioId} no encontrado`);
        }

        const miembro = await this.socioModel.findById(miembroId);
        if (!miembro) {
            throw new NotFoundException(`Miembro con ID ${miembroId} no encontrado`);
        }

        // Actualizar el socio principal del miembro
        miembro.socioPrincipal = socio;
        await miembro.save();

        // Añadir el miembro a la lista de miembros de la familia
        if (!socio.miembrosFamilia) {
            socio.miembrosFamilia = [];
        }
        socio.miembrosFamilia.push(miembro);

        return socio.save();
    }

    async removeMiembroFamilia(socioId: string, miembroId: string): Promise<Socio> {
        this.logger.debug(`Removing miembro from socio with ID: ${socioId}`);
        const socio = await this.socioModel.findById(socioId);
        if (!socio) {
            throw new NotFoundException(`Socio con ID ${socioId} no encontrado`);
        }

        const miembro = await this.socioModel.findById(miembroId);
        if (!miembro) {
            throw new NotFoundException(`Miembro con ID ${miembroId} no encontrado`);
        }

        // Remover el socio principal del miembro
        miembro.socioPrincipal = null;
        await miembro.save();

        // Remover el miembro de la lista de miembros de la familia
        socio.miembrosFamilia = socio.miembrosFamilia.filter(
            m => m.toString() !== miembroId
        );

        return socio.save();
    }
} 