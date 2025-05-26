import { Injectable, NotFoundException, Logger, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Socio } from '../schemas/socio.schema';
import { CreateSocioDto } from '../dto/create-socio.dto';
import { UpdateSocioDto } from '../dto/update-socio.dto';
import { UploadsService } from '../../uploads/uploads.service';
import { Asociado } from '../schemas/asociado.schema';
import { CreateMiembroDto } from '../dto/create-miembro.dto';
import { UpdateMiembroDto } from '../dto/update-miembro.dto';

@Injectable()
export class SociosService {
    private readonly logger = new Logger(SociosService.name);

    constructor(
        @InjectModel(Socio.name) private socioModel: Model<Socio>,
        private uploadsService: UploadsService
    ) { }

    async create(createSocioDto: CreateSocioDto): Promise<Socio> {
        try {
            // Procesar la fecha de nacimiento si existe
            if (createSocioDto.fechaNacimiento) {
                try {
                    const fechaNacimiento = new Date(createSocioDto.fechaNacimiento);
                    if (!isNaN(fechaNacimiento.getTime())) {
                        createSocioDto.fechaNacimiento = fechaNacimiento;
                    } else {
                        delete createSocioDto.fechaNacimiento;
                    }
                } catch (error) {
                    this.logger.error(`Error procesando fecha de nacimiento: ${error.message}`);
                    delete createSocioDto.fechaNacimiento;
                }
            }

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
            const updateData: any = {};

            // Manejar campos simples
            const simpleFields = [
                'socio', 'casa', 'totalSocios', 'numPersonas', 'adheridos', 'menor3Años',
                'cuota', 'dni', 'notas', 'active', 'foto', 'fechaBaja',
                'motivoBaja', 'observaciones', 'rgpd', 'fechaNacimiento'
            ];

            simpleFields.forEach(field => {
                if (updateSocioDto[field] !== undefined) {
                    if (field === 'fechaNacimiento' && updateSocioDto[field]) {
                        try {
                            const fechaNacimiento = new Date(updateSocioDto[field]);
                            if (!isNaN(fechaNacimiento.getTime())) {
                                updateData[field] = fechaNacimiento;
                            }
                        } catch (error) {
                            this.logger.error(`Error procesando fecha de nacimiento: ${error.message}`);
                        }
                    } else {
                        updateData[field] = updateSocioDto[field];
                    }
                }
            });

            // Manejar objetos anidados
            if (updateSocioDto.direccion) {
                const direccionActual = (socio.direccion as any).toObject();
                updateData.direccion = {
                    ...direccionActual,
                    ...updateSocioDto.direccion
                };
            }

            if (updateSocioDto.nombre) {
                const nombreActual = (socio.nombre as any).toObject();
                updateData.nombre = {
                    ...nombreActual,
                    ...updateSocioDto.nombre
                };
            }

            if (updateSocioDto.banco) {
                const bancoActual = (socio.banco as any)?.toObject() || {};
                updateData.banco = {
                    ...bancoActual,
                    ...updateSocioDto.banco
                };
            }

            if (updateSocioDto.contacto) {
                const contactoActual = (socio.contacto as any).toObject();
                updateData.contacto = {
                    ...contactoActual,
                    ...updateSocioDto.contacto
                };
            }

            if (updateSocioDto.asociados) {
                updateData.asociados = updateSocioDto.asociados;
            }

            // Actualizar el socio usando findByIdAndUpdate
            const socioActualizado = await this.socioModel.findByIdAndUpdate(
                id,
                { $set: updateData },
                { new: true, runValidators: true }
            );

            return socioActualizado;
        } catch (error) {
            this.logger.error(`Error actualizando socio con ID ${id}:`, error);
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

    async addAsociado(socioId: string, createMiembroDto: CreateMiembroDto) {
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

    async updateAsociado(socioId: string, asociadoId: string, updateMiembroDto: UpdateMiembroDto) {
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
            this.logger.debug(`Updating asociados for socio ${id}`);
            const socio = await this.socioModel.findById(id);
            if (!socio) {
                throw new NotFoundException(`Socio con ID ${id} no encontrado`);
            }

            // Eliminar fotos de asociados que ya no existen
            const oldAsociados = socio.asociados || [];
            const newAsociadosIds = asociados.map(a => a._id?.toString()).filter(Boolean);
            const deletedAsociados = oldAsociados.filter(a => a._id && !newAsociadosIds.includes(a._id.toString()));

            for (const asociado of deletedAsociados) {
                if (asociado.foto) {
                    try {
                        await this.uploadsService.deleteFile(asociado.foto);
                    } catch (error) {
                        this.logger.warn(`No se pudo eliminar la foto del asociado: ${error.message}`);
                    }
                }
            }

            socio.asociados = asociados;
            return await socio.save();
        } catch (error) {
            this.logger.error(`Error updating asociados for socio ${id}:`, error);
            throw error;
        }
    }

    async findBySocioCode(socio: string): Promise<Socio | null> {
        return this.socioModel.findOne({ socio }).exec();
    }
} 