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
            if (!file || !file.buffer) {
                throw new Error('No file or buffer provided');
            }

            const timestamp = Date.now();
            const filename = `${timestamp}-${file.originalname}`;
            const filepath = join(this.uploadsDir, filename);

            await fs.writeFile(filepath, file.buffer);
            this.logger.debug(`File saved: ${filename} at ${filepath}`);

            // Verificar que el archivo se guardó correctamente
            try {
                const stats = await fs.stat(filepath);
                if (stats.size === 0) {
                    throw new Error('File is empty');
                }
                this.logger.debug(`File verified: ${filename} (${stats.size} bytes)`);
            } catch (error) {
                this.logger.error(`File verification failed: ${filename}`);
                throw new Error('File verification failed');
            }

            return filename;
        } catch (error) {
            this.logger.error(`Error saving file: ${error.message}`);
            throw new Error('Error saving file');
        }
    }

    async deleteFile(filename: string): Promise<void> {
        try {
            const filepath = join(this.uploadsDir, filename);
            try {
                await fs.access(filepath);
                await fs.unlink(filepath);
                this.logger.debug(`File deleted: ${filename}`);
            } catch (error) {
                if (error.code === 'ENOENT') {
                    this.logger.debug(`File not found, skipping deletion: ${filename}`);
                    return;
                }
                throw error;
            }
        } catch (error) {
            this.logger.error(`Error deleting file: ${error.message}`);
            throw new Error('Error deleting file');
        }
    }

    async getFilePath(filename: string): Promise<string> {
        return join(this.uploadsDir, filename);
    }
} 