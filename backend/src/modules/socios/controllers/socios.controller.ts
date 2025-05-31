import { Controller, Get, Post, Body, Param, Delete, UseGuards, Logger, Put, HttpException, HttpStatus, UseInterceptors, UploadedFile, BadRequestException, Query } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SociosService } from '../services/socios.service';
import { CreateSocioDto } from '../dto/create-socio.dto';
import { UpdateSocioDto } from '../dto/update-socio.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../users/types/user-roles.enum';
import { UploadsService } from '../../uploads/uploads.service';
import { Asociado } from '../schemas/asociado.schema';
import { CreateMiembroDto } from '../dto/create-miembro.dto';
import { UpdateMiembroDto } from '../dto/update-miembro.dto';

@Controller('socios')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SociosController {
    private readonly logger = new Logger(SociosController.name);

    constructor(
        private readonly sociosService: SociosService,
        private readonly uploadsService: UploadsService
    ) { }

    @Post()
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA)
    async create(@Body() createSocioDto: CreateSocioDto) {
        this.logger.debug(`Creating new socio: ${JSON.stringify(createSocioDto)}`);
        return this.sociosService.create(createSocioDto);
    }

    @Get()
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA, UserRole.TRABAJADOR)
    async findAll() {
        this.logger.debug('Fetching all socios');
        return this.sociosService.findAll();
    }

    @Get('simplified')
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA, UserRole.TRABAJADOR)
    async getSimplifiedList() {
        this.logger.debug('Fetching simplified list of socios and asociados');
        return this.sociosService.getSimplifiedList();
    }

    @Get('last-number')
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA)
    async getLastNumber() {
        this.logger.debug('Getting last socio number');
        return this.sociosService.getLastNumber();
    }

    @Get('validate-number/:number')
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA)
    async validateNumber(@Param('number') number: string) {
        this.logger.debug(`Validating socio number: ${number}`);
        return this.sociosService.validateNumber(number);
    }

    @Get(':id')
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA, UserRole.TRABAJADOR)
    async findOne(@Param('id') id: string) {
        this.logger.debug(`Fetching socio with ID: ${id}`);
        return this.sociosService.findOne(id);
    }

    @Put(':id')
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA)
    @UseInterceptors(FileInterceptor('foto'))
    async update(
        @Param('id') id: string,
        @Body() updateSocioDto: UpdateSocioDto,
        @UploadedFile() file?: Express.Multer.File
    ) {
        this.logger.debug(`Updating socio ${id} with data: ${JSON.stringify(updateSocioDto)}`);

        if (file) {
            const filename = await this.uploadsService.saveFile(file);
            updateSocioDto.foto = filename;
        }

        return this.sociosService.update(id, updateSocioDto);
    }

    @Put(':id/foto')
    @UseInterceptors(FileInterceptor('foto'))
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA)
    async updateFoto(
        @Param('id') id: string,
        @UploadedFile() file: Express.Multer.File
    ) {
        this.logger.debug(`Updating foto for socio with ID: ${id}`);
        try {
            if (!file) {
                throw new BadRequestException('No se ha proporcionado ningún archivo');
            }

            const filename = await this.uploadsService.saveFile(file);
            if (!filename) {
                throw new BadRequestException('Error al guardar el archivo');
            }

            const socio = await this.sociosService.update(id, { foto: filename });
            return socio;
        } catch (error) {
            this.logger.error('Error updating foto:', error);
            throw error;
        }
    }

    @Delete(':id')
    @Roles(UserRole.ADMINISTRADOR)
    async remove(@Param('id') id: string) {
        this.logger.debug(`Removing socio with ID: ${id}`);
        return this.sociosService.remove(id);
    }

    @Put(':id/toggle-active')
    @Roles(UserRole.ADMINISTRADOR)
    async toggleActive(@Param('id') id: string) {
        this.logger.debug(`Toggling active status for socio with ID: ${id}`);
        return this.sociosService.toggleActive(id);
    }

    @Get(':id/asociados')
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA, UserRole.TRABAJADOR)
    async getAsociados(@Param('id') id: string) {
        return this.sociosService.getAsociados(id);
    }

    @Post(':id/asociados')
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA)
    async addAsociado(
        @Param('id') id: string,
        @Body() createMiembroDto: CreateMiembroDto
    ) {
        return this.sociosService.addAsociado(id, createMiembroDto);
    }

    @Put(':id/asociados/:asociadoId')
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA)
    async updateAsociado(
        @Param('id') id: string,
        @Param('asociadoId') asociadoId: string,
        @Body() updateMiembroDto: UpdateMiembroDto
    ) {
        return this.sociosService.updateAsociado(id, asociadoId, updateMiembroDto);
    }

    @Delete(':id/asociados/:asociadoId')
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA)
    async removeAsociado(
        @Param('id') id: string,
        @Param('asociadoId') asociadoId: string
    ) {
        return this.sociosService.removeAsociado(id, asociadoId);
    }

    @Put(':id/asociados')
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA)
    async updateAsociados(
        @Param('id') id: string,
        @Body() asociados: Asociado[]
    ) {
        return this.sociosService.updateAsociados(id, asociados);
    }
} 