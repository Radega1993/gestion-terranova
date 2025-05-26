import { Controller, Get, Post, Body, Param, Delete, UseGuards, Logger, Put, HttpException, HttpStatus, UseInterceptors, UploadedFile, BadRequestException, Query, Res } from '@nestjs/common';
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
import { Response } from 'express';
import * as ExcelJS from 'exceljs';

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

    @Post('import')
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA)
    @UseInterceptors(FileInterceptor('file'))
    async importSocios(@UploadedFile() file: Express.Multer.File) {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(file.buffer);
        const worksheet = workbook.getWorksheet(1);

        const results = {
            success: [],
            errors: []
        };

        worksheet.eachRow(async (row, rowNumber) => {
            if (rowNumber === 1) return; // Skip header row

            const socioData = {
                socio: row.getCell(1).value?.toString(),
                nombre: {
                    nombre: row.getCell(2).value?.toString(),
                    primerApellido: row.getCell(3).value?.toString(),
                    segundoApellido: row.getCell(4).value?.toString()
                },
                direccion: {
                    calle: row.getCell(5).value?.toString(),
                    numero: row.getCell(6).value?.toString(),
                    piso: row.getCell(7).value?.toString(),
                    poblacion: row.getCell(8).value?.toString(),
                    cp: row.getCell(9).value?.toString(),
                    provincia: row.getCell(10).value?.toString()
                },
                contacto: {
                    telefonos: [row.getCell(11).value?.toString()],
                    emails: [row.getCell(12).value?.toString()]
                },
                dni: row.getCell(13).value?.toString(),
                casa: Number(row.getCell(14).value) || 1,
                totalSocios: Number(row.getCell(15).value) || 1,
                numPersonas: Number(row.getCell(16).value) || 1,
                adheridos: Number(row.getCell(17).value) || 0,
                menor3Años: Number(row.getCell(18).value) || 0,
                cuota: Number(row.getCell(19).value) || 0,
                active: true,
                rgpd: true
            };

            try {
                const existingSocio = await this.sociosService.findBySocioCode(socioData.socio);
                if (existingSocio) {
                    results.errors.push({
                        socio: socioData.socio,
                        error: 'Ya existe un socio con este código'
                    });
                    return;
                }

                await this.sociosService.create(socioData);
                results.success.push(socioData.socio);
            } catch (error) {
                results.errors.push({
                    socio: socioData.socio,
                    error: error.message
                });
            }
        });

        return results;
    }

    @Get('export')
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA)
    async exportSocios(@Res() res: Response) {
        const socios = await this.sociosService.findAll();

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Socios');

        // Add headers
        worksheet.columns = [
            { header: 'Código', key: 'socio', width: 15 },
            { header: 'Nombre', key: 'nombre', width: 20 },
            { header: 'Primer Apellido', key: 'primerApellido', width: 20 },
            { header: 'Segundo Apellido', key: 'segundoApellido', width: 20 },
            { header: 'Calle', key: 'calle', width: 30 },
            { header: 'Número', key: 'numero', width: 10 },
            { header: 'Piso', key: 'piso', width: 10 },
            { header: 'Población', key: 'poblacion', width: 20 },
            { header: 'CP', key: 'cp', width: 10 },
            { header: 'Provincia', key: 'provincia', width: 20 },
            { header: 'Teléfono', key: 'telefono', width: 15 },
            { header: 'Email', key: 'email', width: 30 },
            { header: 'DNI', key: 'dni', width: 15 },
            { header: 'Casa', key: 'casa', width: 10 },
            { header: 'Total Socios', key: 'totalSocios', width: 15 },
            { header: 'Número Personas', key: 'numPersonas', width: 15 },
            { header: 'Adheridos', key: 'adheridos', width: 10 },
            { header: 'Menores 3 Años', key: 'menor3Años', width: 15 },
            { header: 'Cuota', key: 'cuota', width: 10 }
        ];

        // Add data
        socios.forEach(socio => {
            worksheet.addRow({
                socio: socio.socio,
                nombre: socio.nombre.nombre,
                primerApellido: socio.nombre.primerApellido,
                segundoApellido: socio.nombre.segundoApellido,
                calle: socio.direccion.calle,
                numero: socio.direccion.numero,
                piso: socio.direccion.piso,
                poblacion: socio.direccion.poblacion,
                cp: socio.direccion.cp,
                provincia: socio.direccion.provincia,
                telefono: socio.contacto.telefonos[0],
                email: socio.contacto.emails[0],
                dni: socio.dni,
                casa: socio.casa,
                totalSocios: socio.totalSocios,
                numPersonas: socio.numPersonas,
                adheridos: socio.adheridos,
                menor3Años: socio.menor3Años,
                cuota: socio.cuota
            });
        });

        // Style the header row
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=socios.xlsx');

        await workbook.xlsx.write(res);
        res.end();
    }
} 