import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UploadsService } from './uploads.service';
import { UploadsController } from './uploads.controller';

@Module({
    imports: [
        ConfigModule,
        MulterModule.register({
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
            limits: {
                fileSize: 5 * 1024 * 1024, // 5MB
            },
        }),
    ],
    controllers: [UploadsController],
    providers: [UploadsService],
    exports: [UploadsService],
})
export class UploadsModule { } 