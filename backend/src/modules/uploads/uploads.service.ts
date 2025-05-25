import { Injectable, Logger } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';

@Injectable()
export class UploadsService {
    private readonly logger = new Logger(UploadsService.name);
    private readonly uploadsDir = join(process.cwd(), 'uploads');

    constructor() {
        this.ensureUploadsDirectory();
    }

    private async ensureUploadsDirectory() {
        try {
            await fs.access(this.uploadsDir);
            this.logger.debug(`Uploads directory exists at ${this.uploadsDir}`);
        } catch {
            await fs.mkdir(this.uploadsDir, { recursive: true });
            this.logger.debug(`Created uploads directory at ${this.uploadsDir}`);
        }
    }

    async saveFile(file: Express.Multer.File): Promise<string> {
        try {
            this.logger.debug(`Iniciando guardado de archivo: ${file?.originalname}`);
            this.logger.debug(`Tamaño del archivo: ${file?.size} bytes`);
            this.logger.debug(`Tipo MIME: ${file?.mimetype}`);

            if (!file) {
                this.logger.error('No file provided');
                throw new Error('No file provided');
            }

            const timestamp = Date.now();
            const filename = `${timestamp}-${file.originalname}`;
            const filepath = join(this.uploadsDir, filename);

            this.logger.debug(`Guardando archivo como: ${filename}`);
            this.logger.debug(`Ruta completa: ${filepath}`);

            // Usar el path del archivo temporal creado por Multer
            await fs.copyFile(file.path, filepath);
            this.logger.debug(`Archivo guardado exitosamente en: ${filepath}`);

            // Verificar que el archivo se guardó correctamente
            try {
                const stats = await fs.stat(filepath);
                this.logger.debug(`Verificación del archivo: ${filename}`);
                this.logger.debug(`Tamaño del archivo guardado: ${stats.size} bytes`);

                if (stats.size === 0) {
                    this.logger.error(`Archivo guardado está vacío: ${filename}`);
                    throw new Error('File is empty');
                }

                this.logger.debug(`Verificación exitosa del archivo: ${filename}`);
            } catch (error) {
                this.logger.error(`Error en la verificación del archivo: ${filename}`);
                this.logger.error(`Error detallado: ${error.message}`);
                throw new Error('File verification failed');
            }

            return filename;
        } catch (error) {
            this.logger.error(`Error al guardar el archivo: ${error.message}`);
            this.logger.error(`Stack trace: ${error.stack}`);
            throw new Error('Error saving file');
        }
    }

    async deleteFile(filename: string): Promise<void> {
        try {
            this.logger.debug(`Iniciando eliminación del archivo: ${filename}`);
            const filepath = join(this.uploadsDir, filename);

            try {
                await fs.access(filepath);
                this.logger.debug(`Archivo encontrado en: ${filepath}`);

                await fs.unlink(filepath);
                this.logger.debug(`Archivo eliminado exitosamente: ${filename}`);
            } catch (error) {
                if (error.code === 'ENOENT') {
                    this.logger.debug(`Archivo no encontrado, omitiendo eliminación: ${filename}`);
                    return;
                }
                this.logger.error(`Error al acceder al archivo: ${error.message}`);
                throw error;
            }
        } catch (error) {
            this.logger.error(`Error al eliminar el archivo: ${error.message}`);
            this.logger.error(`Stack trace: ${error.stack}`);
            throw new Error('Error deleting file');
        }
    }

    async getFilePath(filename: string): Promise<string> {
        this.logger.debug(`Obteniendo ruta del archivo: ${filename}`);
        const filepath = join(this.uploadsDir, filename);
        this.logger.debug(`Ruta completa: ${filepath}`);
        return filepath;
    }
} 