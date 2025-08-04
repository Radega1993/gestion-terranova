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

        this.logger.debug(`Sanitizing data: ${JSON.stringify(data)}`);
        this.logger.debug(`Input fechaNacimiento type: ${typeof data.fechaNacimiento}`);
        this.logger.debug(`Input fechaNacimiento value: ${data.fechaNacimiento}`);

        const sanitizedData = { ...data };

        // Sanitizar fechaNacimiento primero
        if (sanitizedData.fechaNacimiento) {
            try {
                // Si es un string ISO, convertirlo a Date
                if (typeof sanitizedData.fechaNacimiento === 'string') {
                    this.logger.debug(`Converting string fechaNacimiento in sanitizeData: ${sanitizedData.fechaNacimiento}`);
                    const date = new Date(sanitizedData.fechaNacimiento);
                    if (!isNaN(date.getTime())) {
                        sanitizedData.fechaNacimiento = date;
                        this.logger.debug(`Successfully converted to Date in sanitizeData: ${date}`);
                    } else {
                        this.logger.warn(`Invalid date string for fechaNacimiento in sanitizeData: ${sanitizedData.fechaNacimiento}`);
                        delete sanitizedData.fechaNacimiento;
                    }
                } else if (sanitizedData.fechaNacimiento instanceof Date) {
                    this.logger.debug(`Processing Date object in sanitizeData: ${sanitizedData.fechaNacimiento}`);
                    if (isNaN(sanitizedData.fechaNacimiento.getTime())) {
                        this.logger.warn('Invalid Date object for fechaNacimiento in sanitizeData');
                        delete sanitizedData.fechaNacimiento;
                    } else {
                        this.logger.debug(`Valid Date object in sanitizeData: ${sanitizedData.fechaNacimiento}`);
                    }
                } else {
                    this.logger.warn(`Unexpected type for fechaNacimiento in sanitizeData: ${typeof sanitizedData.fechaNacimiento}`);
                    delete sanitizedData.fechaNacimiento;
                }
            } catch (error) {
                this.logger.error(`Error processing fechaNacimiento in sanitizeData: ${error.message}`);
                delete sanitizedData.fechaNacimiento;
            }
        }

        this.logger.debug(`After fechaNacimiento processing - type: ${typeof sanitizedData.fechaNacimiento}`);
        this.logger.debug(`After fechaNacimiento processing - value: ${sanitizedData.fechaNacimiento}`);

        // No sanitizar objetos complejos como fechaNacimiento
        const sanitizeString = (value: any): string => {
            if (value === null || value === undefined) return '';
            if (value instanceof Date) return value.toISOString();
            return String(value).trim();
        };

        const sanitizeObject = (obj: any): any => {
            if (!obj || typeof obj !== 'object') return obj;
            const result: any = {};
            for (const [key, value] of Object.entries(obj)) {
                // No sanitizar fechaNacimiento
                if (key === 'fechaNacimiento') {
                    result[key] = value;
                    continue;
                }

                // Para arrays (como asociados), preservar la estructura completa
                if (Array.isArray(value)) {
                    result[key] = value.map(item =>
                        typeof item === 'object' ? sanitizeObject(item) : sanitizeString(item)
                    );
                    continue;
                }

                // Para objetos anidados, preservar la estructura
                if (typeof value === 'object' && value !== null) {
                    result[key] = sanitizeObject(value);
                    continue;
                }

                // Para valores primitivos, solo sanitizar si no son null/undefined
                if (value !== null && value !== undefined) {
                    result[key] = sanitizeString(value);
                } else {
                    // Preservar null/undefined para campos opcionales
                    result[key] = value;
                }
            }
            return result;
        };

        const result = sanitizeObject(sanitizedData);
        this.logger.debug(`Final sanitized data - fechaNacimiento type: ${typeof result.fechaNacimiento}`);
        this.logger.debug(`Final sanitized data - fechaNacimiento value: ${result.fechaNacimiento}`);
        return result;
    }

    async create(createSocioDto: CreateSocioDto): Promise<Socio> {
        try {
            const sanitizedData = this.sanitizeData(createSocioDto);

            // Convertir fechaNacimiento a Date si es string
            if (sanitizedData.fechaNacimiento) {
                try {
                    const date = new Date(sanitizedData.fechaNacimiento);
                    if (!isNaN(date.getTime())) {
                        sanitizedData.fechaNacimiento = date;
                    } else {
                        this.logger.warn(`Invalid date format for fechaNacimiento: ${sanitizedData.fechaNacimiento}`);
                        delete sanitizedData.fechaNacimiento;
                    }
                } catch (error) {
                    this.logger.error(`Error parsing fechaNacimiento: ${error.message}`);
                    delete sanitizedData.fechaNacimiento;
                }
            }

            this.logger.debug(`Creating socio with data: ${JSON.stringify(sanitizedData)}`);
            const createdSocio = new this.socioModel(sanitizedData);
            return createdSocio.save();
        } catch (error) {
            this.logger.error(`Error creating socio: ${error.message}`);
            throw error;
        }
    }

    async findAll(): Promise<Socio[]> {
        try {
            return await this.socioModel.find().sort({ socio: 1 }).exec();
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
            this.logger.debug(`Service received update data: ${JSON.stringify(updateSocioDto)}`);

            // Validar que los datos no estén vacíos
            if (!updateSocioDto || Object.keys(updateSocioDto).length === 0) {
                throw new BadRequestException('No se recibieron datos para actualizar');
            }

            // Procesar la fecha de nacimiento antes de la sanitización
            if (updateSocioDto.fechaNacimiento) {
                try {
                    const date = new Date(updateSocioDto.fechaNacimiento);
                    if (!isNaN(date.getTime())) {
                        updateSocioDto.fechaNacimiento = date;
                        this.logger.debug(`Pre-sanitize fechaNacimiento processed: ${date}`);
                    } else {
                        this.logger.warn(`Invalid fechaNacimiento before sanitize: ${updateSocioDto.fechaNacimiento}`);
                        delete updateSocioDto.fechaNacimiento;
                    }
                } catch (error) {
                    this.logger.error(`Error processing fechaNacimiento before sanitize: ${error.message}`);
                    delete updateSocioDto.fechaNacimiento;
                }
            }

            // Eliminar campos que no deben actualizarse
            const { _id, __v, createdAt, updatedAt, ...dataToUpdate } = updateSocioDto;

            const sanitizedData = this.sanitizeData(dataToUpdate);
            this.logger.debug(`After sanitizeData: ${JSON.stringify(sanitizedData)}`);

            // Verificar que la fecha de nacimiento se mantiene después de la sanitización
            if (sanitizedData.fechaNacimiento) {
                this.logger.debug(`fechaNacimiento after sanitize: ${sanitizedData.fechaNacimiento}`);
            }

            const updatedSocio = await this.socioModel.findByIdAndUpdate(
                id,
                { $set: sanitizedData },
                { new: true, runValidators: true }
            ).exec();

            if (!updatedSocio) {
                throw new NotFoundException(`Socio with ID ${id} not found`);
            }

            this.logger.debug(`Updated socio: ${JSON.stringify(updatedSocio)}`);
            return updatedSocio;
        } catch (error) {
            this.logger.error(`Error updating socio: ${error.message}`);
            throw error;
        }
    }

    async updateFoto(id: string, filename: string): Promise<Socio> {
        try {
            this.logger.debug(`Updating foto for socio ${id} with filename: ${filename}`);

            const updatedSocio = await this.socioModel.findByIdAndUpdate(
                id,
                { $set: { foto: filename } },
                { new: true, runValidators: false }
            ).exec();

            if (!updatedSocio) {
                throw new NotFoundException(`Socio with ID ${id} not found`);
            }

            this.logger.debug(`Foto updated successfully for socio: ${id}`);
            return updatedSocio;
        } catch (error) {
            this.logger.error(`Error updating foto for socio ${id}: ${error.message}`);
            throw error;
        }
    }

    async remove(id: string): Promise<void> {
        try {
            const socio = await this.socioModel.findById(id).exec();
            if (!socio) {
                throw new NotFoundException(`Socio with ID ${id} not found`);
            }

            // Eliminar la imagen del socio principal si existe
            if (socio.foto) {
                await this.uploadsService.deleteFile(socio.foto);
            }

            // Eliminar las fotos de los miembros asociados si existen
            if (socio.asociados && socio.asociados.length > 0) {
                for (const asociado of socio.asociados) {
                    if (asociado.foto) {
                        try {
                            await this.uploadsService.deleteFile(asociado.foto);
                        } catch (error) {
                            this.logger.warn(`Error deleting asociado foto ${asociado.foto}: ${error.message}`);
                        }
                    }
                }
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
            fechaNacimiento: createMiembroDto.fechaNacimiento ? new Date(createMiembroDto.fechaNacimiento) : new Date(),
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
        this.logger.debug('Iniciando actualización de asociado');
        this.logger.debug(`Datos recibidos: ${JSON.stringify(updateMiembroDto)}`);

        const socio = await this.socioModel.findById(socioId);
        if (!socio) {
            throw new NotFoundException('Socio no encontrado');
        }

        const asociadoIndex = socio.asociados.findIndex(a => a.codigo === asociadoId);
        if (asociadoIndex === -1) {
            throw new NotFoundException('Asociado no encontrado');
        }

        // Crear un nuevo objeto con los datos actualizados
        const asociadoActualizado: Asociado = {
            codigo: socio.asociados[asociadoIndex].codigo,
            nombre: updateMiembroDto.nombre || socio.asociados[asociadoIndex].nombre,
            telefono: updateMiembroDto.telefono || socio.asociados[asociadoIndex].telefono,
            foto: updateMiembroDto.foto || socio.asociados[asociadoIndex].foto,
            fechaNacimiento: updateMiembroDto.fechaNacimiento ? new Date(updateMiembroDto.fechaNacimiento) : socio.asociados[asociadoIndex].fechaNacimiento
        };

        this.logger.debug(`Datos a actualizar: ${JSON.stringify(asociadoActualizado)}`);

        // Actualizar el asociado
        socio.asociados[asociadoIndex] = asociadoActualizado;
        await socio.save();

        this.logger.debug('Asociado actualizado correctamente');
        return socio.asociados[asociadoIndex];
    }

    async removeAsociado(socioId: string, asociadoId: string) {
        const socio = await this.socioModel.findById(socioId);
        if (!socio) {
            throw new NotFoundException('Socio no encontrado');
        }

        const asociadoIndex = socio.asociados.findIndex(a => a.codigo === asociadoId);
        if (asociadoIndex === -1) {
            throw new NotFoundException('Asociado no encontrado');
        }

        // Eliminar la foto del asociado si existe
        const asociado = socio.asociados[asociadoIndex];
        if (asociado.foto) {
            try {
                await this.uploadsService.deleteFile(asociado.foto);
            } catch (error) {
                this.logger.warn(`Error deleting asociado foto ${asociado.foto}: ${error.message}`);
            }
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
            this.logger.debug('Iniciando búsqueda del último número de socio');

            // Buscar el último socio ordenado por número descendente
            const lastSocio = await this.socioModel
                .findOne({}, { socio: 1 })
                .sort({ socio: -1 })
                .exec();

            this.logger.debug(`Último socio encontrado: ${JSON.stringify(lastSocio)}`);

            if (!lastSocio || !lastSocio.socio) {
                this.logger.debug('No se encontró ningún socio, devolviendo AET000');
                return JSON.stringify({ number: 'AET000' });
            }

            // Extraer el número del último socio
            const lastNumber = parseInt(lastSocio.socio.replace('AET', ''));
            this.logger.debug(`Número extraído del último socio: ${lastNumber}`);

            if (isNaN(lastNumber)) {
                this.logger.debug('El número extraído no es válido, devolviendo AET000');
                return JSON.stringify({ number: 'AET000' });
            }

            const nextNumber = (lastNumber + 1).toString().padStart(3, '0');
            const result = `AET${nextNumber}`;
            this.logger.debug(`Siguiente número calculado: ${result}`);

            return JSON.stringify({ number: result });
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
            this.logger.debug('Iniciando actualización de asociados');
            this.logger.debug(`Datos recibidos: ${JSON.stringify(asociados)}`);

            // Obtener el socio actual
            const socio = await this.socioModel.findById(id);
            if (!socio) {
                throw new NotFoundException('Socio no encontrado');
            }

            // Validar y procesar cada asociado
            const asociadosProcesados = socio.asociados?.map(asociadoExistente => {
                // Buscar el asociado actualizado en la lista recibida
                const asociadoActualizado = asociados.find(a => a.codigo === asociadoExistente.codigo);

                if (asociadoActualizado) {
                    // Si encontramos el asociado, actualizamos solo la foto
                    return {
                        codigo: asociadoExistente.codigo,
                        nombre: asociadoExistente.nombre,
                        fechaNacimiento: asociadoExistente.fechaNacimiento,
                        telefono: asociadoExistente.telefono || '',
                        foto: asociadoActualizado.foto
                    };
                }

                // Si no encontramos el asociado, mantenemos el existente sin cambios
                return asociadoExistente;
            }) || [];

            this.logger.debug(`Asociados procesados: ${JSON.stringify(asociadosProcesados)}`);

            // Actualizar el socio con los asociados procesados
            const updatedSocio = await this.socioModel.findByIdAndUpdate(
                id,
                { $set: { asociados: asociadosProcesados } },
                { new: true, runValidators: true }
            ).exec();

            if (!updatedSocio) {
                throw new NotFoundException('Error al actualizar los asociados');
            }

            this.logger.debug('Asociados actualizados correctamente');
            return updatedSocio;
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
            const socios = await this.socioModel.find().sort({ socio: 1 }).exec();
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