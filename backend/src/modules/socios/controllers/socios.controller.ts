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

    @Post('import')
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA)
    @UseInterceptors(FileInterceptor('file'))
    async importSocios(@UploadedFile() file: Express.Multer.File) {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(file.buffer);
        const worksheet = workbook.getWorksheet(1);

        const results = {
            success: [],
            errors: [],
            updates: []
        };

        // Procesar socios
        for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
            const row = worksheet.getRow(rowNumber);

            // Verificar si la fila tiene datos
            if (!row.getCell(1).value) continue;

            const socioData = {
                socio: row.getCell(1).value?.toString(),
                nombre: {
                    nombre: row.getCell(2).value?.toString() || '',
                    primerApellido: row.getCell(3).value?.toString() || '',
                    segundoApellido: row.getCell(4).value?.toString() || ''
                },
                direccion: {
                    calle: row.getCell(5).value?.toString() || '',
                    numero: row.getCell(6).value?.toString() || '',
                    piso: row.getCell(7).value?.toString() || '',
                    poblacion: row.getCell(8).value?.toString() || '',
                    cp: row.getCell(9).value?.toString() || '',
                    provincia: row.getCell(10).value?.toString() || ''
                },
                contacto: {
                    telefonos: [row.getCell(11).value?.toString() || ''],
                    emails: [row.getCell(12).value?.toString() || '']
                },
                dni: row.getCell(13).value?.toString() || '',
                casa: Number(row.getCell(14).value) || 0,
                totalSocios: Number(row.getCell(15).value) || 0,
                numPersonas: Number(row.getCell(16).value) || 0,
                adheridos: Number(row.getCell(17).value) || 0,
                menor3Años: Number(row.getCell(18).value) || 0,
                cuota: Number(row.getCell(19).value) || 0,
                active: true,
                rgpd: true
            };

            try {
                // Validar datos requeridos
                if (!socioData.socio) {
                    throw new Error('El código de socio es obligatorio');
                }

                if (!socioData.nombre.nombre) {
                    throw new Error('El nombre es obligatorio');
                }

                const existingSocio = await this.sociosService.findBySocioCode(socioData.socio);
                if (existingSocio) {
                    // Verificar si hay cambios en los datos del socio
                    const hasChanges = this.hasSocioChanges(existingSocio, socioData);

                    // Obtener asociados actuales
                    const currentAsociados = await this.sociosService.getAsociados(existingSocio._id);

                    // Preparar datos de nuevos asociados
                    const newAsociadosData = [
                        { nombre: row.getCell(20).value?.toString(), telefono: row.getCell(21).value?.toString() },
                        { nombre: row.getCell(22).value?.toString(), telefono: row.getCell(23).value?.toString() },
                        { nombre: row.getCell(24).value?.toString(), telefono: row.getCell(25).value?.toString() },
                        { nombre: row.getCell(26).value?.toString(), telefono: row.getCell(27).value?.toString() }
                    ].filter(a => a.nombre && a.nombre.trim() !== '');

                    // Verificar si hay cambios en los asociados
                    const hasAsociadosChanges = this.hasAsociadosChanges(currentAsociados, newAsociadosData);

                    if (hasChanges || hasAsociadosChanges) {
                        results.updates.push({
                            socio: socioData.socio,
                            changes: {
                                socio: hasChanges,
                                asociados: hasAsociadosChanges
                            }
                        });
                    } else {
                        results.success.push(socioData.socio);
                    }
                    continue;
                }

                const newSocio = await this.sociosService.create(socioData);
                results.success.push(socioData.socio);

                // Procesar asociados de la misma fila
                const asociadosData = [
                    { nombre: row.getCell(20).value?.toString(), telefono: row.getCell(21).value?.toString() },
                    { nombre: row.getCell(22).value?.toString(), telefono: row.getCell(23).value?.toString() },
                    { nombre: row.getCell(24).value?.toString(), telefono: row.getCell(25).value?.toString() },
                    { nombre: row.getCell(26).value?.toString(), telefono: row.getCell(27).value?.toString() }
                ];

                // Añadir asociados que tengan nombre
                for (const asociado of asociadosData) {
                    if (asociado.nombre && asociado.nombre.trim() !== '') {
                        try {
                            const asociadoDto: CreateMiembroDto = {
                                nombre: asociado.nombre.trim(),
                                telefono: asociado.telefono?.trim() || '',
                                fechaNacimiento: undefined
                            };
                            await this.sociosService.addAsociado(newSocio._id, asociadoDto);
                        } catch (error) {
                            results.errors.push({
                                socio: socioData.socio,
                                asociado: asociado.nombre,
                                error: `Error al importar asociado: ${error.message}`
                            });
                        }
                    }
                }
            } catch (error) {
                results.errors.push({
                    socio: socioData.socio || `Fila ${rowNumber}`,
                    error: error.message
                });
            }
        }

        return {
            message: `Importación ${results.success.length > 0 ? 'parcialmente ' : ''}exitosa`,
            success: results.success,
            updates: results.updates,
            errors: results.errors
        };
    }

    @Post('import/update')
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA)
    @UseInterceptors(FileInterceptor('file'))
    async updateSociosFromImport(@UploadedFile() file: Express.Multer.File) {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(file.buffer);
        const worksheet = workbook.getWorksheet(1);

        const results = {
            success: [],
            errors: []
        };

        // Procesar socios
        for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
            const row = worksheet.getRow(rowNumber);

            // Verificar si la fila tiene datos
            if (!row.getCell(1).value) continue;

            const socioData = {
                socio: row.getCell(1).value?.toString(),
                nombre: {
                    nombre: row.getCell(2).value?.toString() || '',
                    primerApellido: row.getCell(3).value?.toString() || '',
                    segundoApellido: row.getCell(4).value?.toString() || ''
                },
                direccion: {
                    calle: row.getCell(5).value?.toString() || '',
                    numero: row.getCell(6).value?.toString() || '',
                    piso: row.getCell(7).value?.toString() || '',
                    poblacion: row.getCell(8).value?.toString() || '',
                    cp: row.getCell(9).value?.toString() || '',
                    provincia: row.getCell(10).value?.toString() || ''
                },
                contacto: {
                    telefonos: [row.getCell(11).value?.toString() || ''],
                    emails: [row.getCell(12).value?.toString() || '']
                },
                dni: row.getCell(13).value?.toString() || '',
                casa: Number(row.getCell(14).value) || 0,
                totalSocios: Number(row.getCell(15).value) || 0,
                numPersonas: Number(row.getCell(16).value) || 0,
                adheridos: Number(row.getCell(17).value) || 0,
                menor3Años: Number(row.getCell(18).value) || 0,
                cuota: Number(row.getCell(19).value) || 0,
                active: true,
                rgpd: true
            };

            try {
                // Validar datos requeridos
                if (!socioData.socio) {
                    throw new Error('El código de socio es obligatorio');
                }

                if (!socioData.nombre.nombre) {
                    throw new Error('El nombre es obligatorio');
                }

                const existingSocio = await this.sociosService.findBySocioCode(socioData.socio);
                if (!existingSocio) {
                    results.errors.push({
                        socio: socioData.socio,
                        error: 'No se encontró el socio para actualizar'
                    });
                    continue;
                }

                // Actualizar datos del socio
                await this.sociosService.update(existingSocio._id, socioData);

                // Obtener asociados actuales
                const currentAsociados = await this.sociosService.getAsociados(existingSocio._id);

                // Preparar datos de nuevos asociados
                const newAsociadosData = [
                    { nombre: row.getCell(20).value?.toString(), telefono: row.getCell(21).value?.toString() },
                    { nombre: row.getCell(22).value?.toString(), telefono: row.getCell(23).value?.toString() },
                    { nombre: row.getCell(24).value?.toString(), telefono: row.getCell(25).value?.toString() },
                    { nombre: row.getCell(26).value?.toString(), telefono: row.getCell(27).value?.toString() }
                ].filter(a => a.nombre && a.nombre.trim() !== '');

                // Eliminar asociados actuales
                for (const asociado of currentAsociados) {
                    await this.sociosService.removeAsociado(existingSocio._id.toString(), asociado._id.toString());
                }

                // Añadir nuevos asociados
                for (const asociado of newAsociadosData) {
                    try {
                        const asociadoDto: CreateMiembroDto = {
                            nombre: asociado.nombre.trim(),
                            telefono: asociado.telefono?.trim() || '',
                            fechaNacimiento: undefined
                        };
                        await this.sociosService.addAsociado(existingSocio._id, asociadoDto);
                    } catch (error) {
                        results.errors.push({
                            socio: socioData.socio,
                            asociado: asociado.nombre,
                            error: `Error al actualizar asociado: ${error.message}`
                        });
                    }
                }

                results.success.push(socioData.socio);
            } catch (error) {
                results.errors.push({
                    socio: socioData.socio || `Fila ${rowNumber}`,
                    error: error.message
                });
            }
        }

        return {
            message: `Actualización ${results.success.length > 0 ? 'parcialmente ' : ''}exitosa`,
            success: results.success,
            errors: results.errors
        };
    }

    private hasSocioChanges(existingSocio: any, newSocioData: any): boolean {
        // Comparar campos básicos
        if (existingSocio.nombre.nombre !== newSocioData.nombre.nombre ||
            existingSocio.nombre.primerApellido !== newSocioData.nombre.primerApellido ||
            existingSocio.nombre.segundoApellido !== newSocioData.nombre.segundoApellido ||
            existingSocio.direccion.calle !== newSocioData.direccion.calle ||
            existingSocio.direccion.numero !== newSocioData.direccion.numero ||
            existingSocio.direccion.piso !== newSocioData.direccion.piso ||
            existingSocio.direccion.poblacion !== newSocioData.direccion.poblacion ||
            existingSocio.direccion.cp !== newSocioData.direccion.cp ||
            existingSocio.direccion.provincia !== newSocioData.direccion.provincia ||
            existingSocio.contacto.telefonos[0] !== newSocioData.contacto.telefonos[0] ||
            existingSocio.contacto.emails[0] !== newSocioData.contacto.emails[0] ||
            existingSocio.dni !== newSocioData.dni ||
            existingSocio.casa !== newSocioData.casa ||
            existingSocio.totalSocios !== newSocioData.totalSocios ||
            existingSocio.numPersonas !== newSocioData.numPersonas ||
            existingSocio.adheridos !== newSocioData.adheridos ||
            existingSocio.menor3Años !== newSocioData.menor3Años ||
            existingSocio.cuota !== newSocioData.cuota) {
            return true;
        }
        return false;
    }

    private hasAsociadosChanges(currentAsociados: any[], newAsociados: any[]): boolean {
        // Si hay diferente número de asociados, hay cambios
        if (currentAsociados.length !== newAsociados.length) {
            return true;
        }

        // Comparar cada asociado
        for (let i = 0; i < newAsociados.length; i++) {
            const current = currentAsociados[i];
            const nuevo = newAsociados[i];

            if (current.nombre !== nuevo.nombre ||
                current.telefono !== nuevo.telefono) {
                return true;
            }
        }

        return false;
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
            { header: 'Cuota', key: 'cuota', width: 10 },
            { header: 'Asociado 1', key: 'asociado1', width: 30 },
            { header: 'Teléfono Asociado 1', key: 'telefonoAsociado1', width: 15 },
            { header: 'Asociado 2', key: 'asociado2', width: 30 },
            { header: 'Teléfono Asociado 2', key: 'telefonoAsociado2', width: 15 },
            { header: 'Asociado 3', key: 'asociado3', width: 30 },
            { header: 'Teléfono Asociado 3', key: 'telefonoAsociado3', width: 15 },
            { header: 'Asociado 4', key: 'asociado4', width: 30 },
            { header: 'Teléfono Asociado 4', key: 'telefonoAsociado4', width: 15 }
        ];

        // Add data
        for (const socio of socios) {
            const asociados = await this.sociosService.getAsociados(socio._id);

            // Preparar datos de asociados
            const asociadosData = {
                asociado1: asociados[0]?.nombre || '',
                telefonoAsociado1: asociados[0]?.telefono || '',
                asociado2: asociados[1]?.nombre || '',
                telefonoAsociado2: asociados[1]?.telefono || '',
                asociado3: asociados[2]?.nombre || '',
                telefonoAsociado3: asociados[2]?.telefono || '',
                asociado4: asociados[3]?.nombre || '',
                telefonoAsociado4: asociados[3]?.telefono || ''
            };

            // Añadir fila con socio y sus asociados
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
                cuota: socio.cuota,
                ...asociadosData
            });
        }

        // Style the header row
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

        // Aplicar estilos a las filas
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1) { // Skip header row
                row.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFE0E0E0' }
                };
            }
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=socios.xlsx');

        await workbook.xlsx.write(res);
        res.end();
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