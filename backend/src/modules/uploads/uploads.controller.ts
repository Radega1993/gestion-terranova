import { Controller, Post, Get, UseInterceptors, UploadedFile, UseGuards, Res, Param, Logger, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadsService } from './uploads.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';
import { Response } from 'express';
import { createReadStream } from 'fs';
import { join } from 'path';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('uploads')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UploadsController {
    private readonly logger = new Logger(UploadsController.name);

    constructor(private readonly uploadsService: UploadsService) { }

    @Post('image')
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA, UserRole.TRABAJADOR)
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

        const filename = await this.uploadsService.saveFile(file);

        return { filename };
    }

    @Get(':filename')
    async getImage(@Param('filename') filename: string, @Res() res: Response) {
        try {
            const filePath = await this.uploadsService.getFilePath(filename);

            // Determinar el tipo MIME basado en la extensión del archivo
            const ext = extname(filename).toLowerCase();
            let contentType = 'image/jpeg'; // valor por defecto
            switch (ext) {
                case '.png':
                    contentType = 'image/png';
                    break;
                case '.gif':
                    contentType = 'image/gif';
                    break;
                case '.jpeg':
                case '.jpg':
                    contentType = 'image/jpeg';
                    break;
            }

            res.setHeader('Content-Type', contentType);
            res.setHeader('Cache-Control', 'public, max-age=31536000');
            res.setHeader('Access-Control-Allow-Origin', '*');

            const fileStream = createReadStream(filePath);
            fileStream.on('error', (error) => {
                this.logger.error(`Error al leer el archivo: ${error.message}`);
                res.status(404).send('Image not found');
            });

            fileStream.pipe(res);
        } catch (error) {
            this.logger.error(`Error al servir la imagen: ${error.message}`);
            res.status(404).send('Image not found');
        }
    }

    @Post('socio/:id/foto')
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA, UserRole.TRABAJADOR)
    @UseInterceptors(FileInterceptor('file'))
    async uploadSocioFoto(
        @Param('id') id: string,
        @UploadedFile() file: Express.Multer.File
    ) {
        if (!file) {
            throw new BadRequestException('No se ha proporcionado ningún archivo');
        }

        try {
            const filename = await this.uploadsService.saveFile(file);
            const socio = await this.uploadsService.updateSocioFoto(id, filename);
            return { message: 'Foto actualizada correctamente', socio };
        } catch (error) {
            throw error;
        }
    }
} 