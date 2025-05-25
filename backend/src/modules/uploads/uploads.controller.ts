import { Controller, Post, Get, UseInterceptors, UploadedFile, UseGuards, Res, Param, Logger } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadsService } from './uploads.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/types/user-roles.enum';
import { Response } from 'express';
import { createReadStream } from 'fs';
import { join } from 'path';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('uploads')
export class UploadsController {
    private readonly logger = new Logger(UploadsController.name);

    constructor(private readonly uploadsService: UploadsService) { }

    @Post('image')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA)
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: './uploads',
            filename: (req, file, callback) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                callback(null, `${uniqueSuffix}${extname(file.originalname)}`);
            },
        }),
        fileFilter: (req, file, callback) => {
            if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
                return callback(new Error('Only image files are allowed!'), false);
            }
            callback(null, true);
        },
    }))
    async uploadImage(@UploadedFile() file: Express.Multer.File) {
        this.logger.debug(`Iniciando carga de imagen: ${file?.originalname}`);
        this.logger.debug(`Tamaño de la imagen: ${file?.size} bytes`);
        this.logger.debug(`Tipo MIME: ${file?.mimetype}`);

        const filename = await this.uploadsService.saveFile(file);
        this.logger.debug(`Imagen guardada con nombre: ${filename}`);

        return { filename };
    }

    @Get(':filename')
    async getImage(@Param('filename') filename: string, @Res() res: Response) {
        this.logger.debug(`Solicitud de imagen: ${filename}`);
        try {
            const filePath = await this.uploadsService.getFilePath(filename);
            this.logger.debug(`Sirviendo imagen desde: ${filePath}`);

            res.setHeader('Content-Type', 'image/jpeg');
            res.setHeader('Cache-Control', 'public, max-age=31536000');
            res.setHeader('Access-Control-Allow-Origin', '*');

            const fileStream = createReadStream(filePath);
            fileStream.on('error', (error) => {
                this.logger.error(`Error al leer el archivo: ${error.message}`);
                res.status(404).send('Image not found');
            });

            fileStream.pipe(res);
            this.logger.debug(`Imagen enviada exitosamente: ${filename}`);
        } catch (error) {
            this.logger.error(`Error al servir la imagen: ${error.message}`);
            res.status(404).send('Image not found');
        }
    }
} 