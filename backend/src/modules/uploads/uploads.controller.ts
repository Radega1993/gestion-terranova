import { Controller, Post, UseInterceptors, UploadedFile, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadsService } from './uploads.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/types/user-roles.enum';

@Controller('uploads')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UploadsController {
    constructor(private readonly uploadsService: UploadsService) { }

    @Post('image')
    @UseInterceptors(FileInterceptor('file'))
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA)
    async uploadImage(@UploadedFile() file: Express.Multer.File) {
        const filename = await this.uploadsService.saveFile(file);
        return { filename };
    }
} 