import { Injectable, NotFoundException, Logger, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Socio } from '../schemas/socio.schema';
import { CreateSocioDto } from '../dto/create-socio.dto';
import { UpdateSocioDto } from '../dto/update-socio.dto';
import { UploadsService } from '../../uploads/uploads.service';
import { Asociado } from '../schemas/asociado.schema';
import { CreateAsociadoDto } from '../dto/create-asociado.dto';
import { UpdateAsociadoDto } from '../dto/update-asociado.dto';

@Injectable()
export class SociosService {
    private readonly logger = new Logger(SociosService.name);

    constructor(
        @InjectModel(Socio.name) private socioModel: Model<Socio>,
        private uploadsService: UploadsService
    ) { }

    private sanitizeData(data: any): any {
        if (!data) return data;

        const sanitizeString = (value: any): string => {
            if (!value) return '';
            try {
                const str = String(value).trim();
                return str.normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .replace(/[^\x20-\x7E]/g, '');
            } catch (error) {
                return '';
            }
        };

        const sanitizeObject = (obj: any): any => {
            if (!obj || typeof obj !== 'object') return obj;

            const result = Array.isArray(obj) ? [] : {};

            for (const [key, value] of Object.entries(obj)) {
                if (typeof value === 'string') {
                    result[key] = sanitizeString(value);
                } else if (typeof value === 'object' && value !== null) {
                    result[key] = sanitizeObject(value);
                } else {
                    result[key] = value;
                }
            }

            return result;
        };

        return sanitizeObject(data);
    }

    async create(createSocioDto: CreateSocioDto): Promise<Socio> {
        try {
            const sanitizedData = this.sanitizeData(createSocioDto);
            const createdSocio = new this.socioModel(sanitizedData);
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
            const sanitizedData = this.sanitizeData(updateSocioDto);
            return await this.socioModel.findByIdAndUpdate(id, sanitizedData, { new: true }).exec();
        } catch (error) {
            this.logger.error(`Error updating socio: ${error.message}`);
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
        const socio = await this.socioModel.findById(id);
        if (!socio) {
            throw new NotFoundException(`Socio con ID ${id} no encontrado`);
        }
        socio.active = !socio.active;
        return socio.save();
    }

    async addAsociado(socioId: string, createMiembroDto: CreateAsociadoDto) {
        const socio = await this.socioModel.findById(socioId);
        if (!socio) {
            throw new NotFoundException('Socio no encontrado');
        }

        // Obtener el último número de asociado
        const ultimoAsociado = socio.asociados?.length || 0;
        const nuevoNumero = (ultimoAsociado + 1).toString().padStart(2, '0');

        // Crear el código del asociado basado en el código del socio
        const codigoAsociado = `${socio.socio}_${nuevoNumero}`;

        const asociado: Asociado = {
            codigo: codigoAsociado,
            nombre: createMiembroDto.nombre,
            fechaNacimiento: createMiembroDto.fechaNacimiento || new Date(),
            telefono: createMiembroDto.telefono || '',
            foto: createMiembroDto.foto || ''
        };

        if (!socio.asociados) {
            socio.asociados = [];
        }

        socio.asociados.push(asociado);
        await socio.save();

        return asociado;
    }

    async updateAsociado(socioId: string, asociadoId: string, updateMiembroDto: UpdateAsociadoDto) {
        const socio = await this.socioModel.findById(socioId);
        if (!socio) {
            throw new NotFoundException('Socio no encontrado');
        }

        const asociadoIndex = socio.asociados.findIndex(a => a.codigo === asociadoId);
        if (asociadoIndex === -1) {
            throw new NotFoundException('Asociado no encontrado');
        }

        // Actualizar solo los campos proporcionados
        Object.assign(socio.asociados[asociadoIndex], updateMiembroDto);
        await socio.save();

        return socio.asociados[asociadoIndex];
    }

    async removeAsociado(socioId: string, asociadoId: string) {
        const socio = await this.socioModel.findById(socioId);
        if (!socio) {
            throw new NotFoundException('Socio no encontrado');
        }

        const asociadoIndex = socio.asociados.findIndex(a => a._id.toString() === asociadoId);
        if (asociadoIndex === -1) {
            throw new NotFoundException('Asociado no encontrado');
        }

        socio.asociados.splice(asociadoIndex, 1);
        await socio.save();

        return { message: 'Asociado eliminado correctamente' };
    }

    async getAsociados(socioId: string) {
        const socio = await this.socioModel.findById(socioId);
        if (!socio) {
            throw new NotFoundException('Socio no encontrado');
        }

        return socio.asociados || [];
    }

    async getLastNumber(): Promise<string> {
        try {
            // Buscar el último socio ordenado por número descendente
            const lastSocio = await this.socioModel
                .findOne({}, { socio: 1 })
                .sort({ socio: -1 })
                .exec();

            if (!lastSocio || !lastSocio.socio) {
                return 'AET000';
            }

            // Extraer el número del último socio
            const lastNumber = parseInt(lastSocio.socio.replace('AET', ''));
            if (isNaN(lastNumber)) {
                return 'AET000';
            }
            const nextNumber = (lastNumber + 1).toString().padStart(3, '0');
            return `AET${nextNumber}`;
        } catch (error) {
            this.logger.error('Error getting last socio number:', error);
            throw error;
        }
    }

    async validateNumber(number: string): Promise<{ available: boolean }> {
        try {
            // Validar formato
            if (!/^AET\d{3}$/.test(number)) {
                throw new BadRequestException('El número de socio debe tener el formato AET000');
            }

            // Buscar si el número ya existe
            const existingSocio = await this.socioModel.findOne({ socio: number }).exec();
            return { available: !existingSocio };
        } catch (error) {
            this.logger.error(`Error validating socio number ${number}:`, error);
            throw error;
        }
    }

    async getMiembros(socioId: string) {
        const socio = await this.socioModel.findById(socioId);
        if (!socio) {
            throw new NotFoundException('Socio no encontrado');
        }

        return socio.asociados || [];
    }

    async updateAsociados(id: string, asociados: Asociado[]): Promise<Socio> {
        try {
            const sanitizedAsociados = this.sanitizeData(asociados);
            return await this.socioModel.findByIdAndUpdate(
                id,
                { $set: { asociados: sanitizedAsociados } },
                { new: true }
            ).exec();
        } catch (error) {
            this.logger.error(`Error updating asociados: ${error.message}`);
            throw error;
        }
    }

    async findBySocioCode(socioCode: string): Promise<Socio | null> {
        try {
            return await this.socioModel.findOne({ socio: socioCode }).exec();
        } catch (error) {
            this.logger.error(`Error finding socio by code: ${error.message}`);
            throw error;
        }
    }

    async getSimplifiedList(): Promise<any[]> {
        try {
            const socios = await this.socioModel.find().exec();
            return socios.map(socio => ({
                _id: socio._id,
                socio: socio.socio,
                nombreCompleto: `${socio.nombre.nombre} ${socio.nombre.primerApellido} ${socio.nombre.segundoApellido || ''}`.trim(),
                asociados: socio.asociados?.map(asociado => ({
                    _id: asociado._id,
                    codigo: asociado.codigo,
                    nombreCompleto: asociado.nombre
                })) || []
            }));
        } catch (error) {
            this.logger.error(`Error getting simplified list: ${error.message}`);
            throw error;
        }
    }
} 