import { Injectable, Logger, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Socio } from '../socios/schemas/socio.schema';

@Injectable()
export class UploadsService {
    private readonly logger = new Logger(UploadsService.name);
    private readonly uploadsDir = join(process.cwd(), 'uploads');

    constructor(
        @InjectModel(Socio.name) private readonly socioModel: Model<Socio>
    ) {
        this.ensureUploadsDirectory();
    }

    private async ensureUploadsDirectory() {
        try {
            await fs.access(this.uploadsDir);
        } catch {
            await fs.mkdir(this.uploadsDir, { recursive: true });
        }
    }

    async saveFile(file: Express.Multer.File): Promise<string> {
        try {
            // El archivo ya está guardado en disco por Multer, solo necesitamos devolver el nombre
            return file.filename;
        } catch (error) {
            this.logger.error(`Error al guardar el archivo: ${error.message}`);
            throw new InternalServerErrorException('Error al guardar el archivo');
        }
    }

    async deleteFile(filename: string): Promise<void> {
        try {
            const filepath = join(this.uploadsDir, filename);
            await fs.unlink(filepath);
        } catch (error) {
            this.logger.debug(`Archivo no encontrado, omitiendo eliminación: ${filename}`);
        }
    }

    async getFilePath(filename: string): Promise<string> {
        const filepath = join(this.uploadsDir, filename);
        try {
            await fs.access(filepath);
            return filepath;
        } catch (error) {
            this.logger.error(`Archivo no encontrado: ${filename}`);
            throw new NotFoundException('Archivo no encontrado');
        }
    }

    async updateSocioFoto(socioId: string, foto: string): Promise<Socio> {
        try {
            // Primero obtenemos el socio actual para preservar sus datos
            const socioActual = await this.socioModel.findById(socioId);
            if (!socioActual) {
                throw new NotFoundException('Socio no encontrado');
            }

            // Si hay una foto anterior, la eliminamos
            if (socioActual.foto) {
                await this.deleteFile(socioActual.foto);
            }

            // Actualizamos solo el campo foto, preservando el resto de datos
            const socioActualizado = await this.socioModel.findByIdAndUpdate(
                socioId,
                { $set: { foto } },
                { new: true, runValidators: true }
            );

            if (!socioActualizado) {
                throw new NotFoundException('Error al actualizar la foto del socio');
            }

            return socioActualizado;
        } catch (error) {
            this.logger.error(`Error en updateSocioFoto: ${error.message}`);
            throw new InternalServerErrorException('Error al actualizar la foto del socio');
        }
    }
} 