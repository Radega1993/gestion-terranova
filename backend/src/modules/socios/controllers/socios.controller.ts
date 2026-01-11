import { Controller, Get, Post, Body, Param, Delete, UseGuards, Logger, Put, HttpException, HttpStatus, UseInterceptors, UploadedFile, BadRequestException, Query, NotFoundException, Res } from '@nestjs/common';
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
import { CreateAsociadoDto } from '../dto/create-asociado.dto';
import { UpdateAsociadoDto } from '../dto/update-asociado.dto';
import * as ExcelJS from 'exceljs';
import { Response } from 'express';

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
        return this.sociosService.create(createSocioDto);
    }

    @Get()
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA, UserRole.TRABAJADOR, UserRole.TIENDA)
    async findAll() {
        return this.sociosService.findAll();
    }

    @Get('simplified')
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA, UserRole.TRABAJADOR, UserRole.TIENDA)
    async getSimplifiedList() {
        return this.sociosService.getSimplifiedList();
    }

    @Get('last-number')
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA, UserRole.TRABAJADOR, UserRole.TIENDA)
    async getLastNumber() {
        return this.sociosService.getLastNumber();
    }

    @Get('validate-number/:number')
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA, UserRole.TRABAJADOR, UserRole.TIENDA)
    async validateNumber(@Param('number') number: string) {
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
            errors: []
        };

        let currentSocio = null;
        let asociados = [];
        let existingSocioId = null;
        let emptyRowCount = 0;

        // Función para sanitizar strings
        const sanitizeString = (value: any): string => {
            if (!value) return '';
            try {
                // Convertir a string y eliminar caracteres no válidos
                const str = String(value).trim();
                // Reemplazar caracteres especiales y acentos
                return str.normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '') // Eliminar diacríticos
                    .replace(/[^\x20-\x7E]/g, ''); // Mantener solo caracteres ASCII imprimibles
            } catch (error) {
                this.logger.error(`Error sanitizando string: ${error.message}`);
                return '';
            }
        };

        // Función robusta para procesar cualquier valor de fecha
        function parseToValidDate(value: any): Date | undefined {
            if (!value) return undefined;
            if (typeof value === 'string') {
                const trimmed = value.trim();
                if (!trimmed || trimmed === '--') return undefined;
                // Si es un string ISO o MM/DD/YYYY
                const date = new Date(trimmed);
                if (!isNaN(date.getTime())) return date;
                // Probar MM/DD/YYYY
                const match = trimmed.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
                if (match) {
                    const [, month, day, year] = match;
                    const d = new Date(Number(year), Number(month) - 1, Number(day));
                    if (!isNaN(d.getTime())) return d;
                }
                return undefined;
            }
            if (value instanceof Date && !isNaN(value.getTime())) return value;
            if (typeof value === 'number') {
                // Excel almacena fechas como días desde 1900-01-01
                const excelEpoch = new Date(1900, 0, 1);
                const millisecondsPerDay = 24 * 60 * 60 * 1000;
                const date = new Date(excelEpoch.getTime() + (value - 1) * millisecondsPerDay);
                return !isNaN(date.getTime()) ? date : undefined;
            }
            return undefined;
        }

        // Limpieza de emails y teléfonos
        function cleanEmail(value: any): string {
            if (!value) return '';
            if (typeof value === 'string') return value.replace(/[, ]+$/, '').trim();
            return '';
        }
        function cleanTelefono(value: any): string {
            if (!value) return '';
            if (typeof value === 'string') return value.replace(/[, ]+$/, '').trim();
            return '';
        }

        // Convert worksheet to array for sequential processing
        const rows = worksheet.getRows(1, worksheet.rowCount);
        if (!rows) {
            return results;
        }


        // Función para procesar email
        const processEmail = (value: any): string => {
            if (!value) return '';
            if (typeof value === 'string') return value.trim();
            if (typeof value === 'object' && value !== null) {
                // Intentar extraer el email del objeto
                if (value.text) return value.text.trim();
                if (value.hyperlink) return value.hyperlink.trim();
                if (value.value) return value.value.trim();
            }
            return '';
        };

        // Skip header row
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            const codigo = sanitizeString(row.getCell(1).value);
            // Log de todos los valores de la fila para debug
            const filaValores = row.values ? (Array.isArray(row.values) ? row.values : Object.values(row.values)) : [];

            if (!codigo) {
                emptyRowCount++;
                // Si hay más de 10 filas vacías seguidas, detenemos la importación
                if (emptyRowCount > 10) {
                    this.logger.warn(`Se encontraron más de 10 filas seguidas vacías. Deteniendo la importación en la fila ${i}.`);
                    break;
                }
                continue;
            } else {
                emptyRowCount = 0; // Reinicia el contador si hay datos
            }


            // Check if this is a main socio or an asociado
            const isAsociado = codigo.includes('_');

            if (!isAsociado) {
                // If we have a previous socio, save it with its asociados
                if (currentSocio) {
                    try {
                        // Check if socio exists before trying to create it
                        const existingSocio = await this.sociosService.findBySocioCode(currentSocio.socio);
                        if (existingSocio) {
                            // Actualizar los asociados del socio existente
                            if (asociados.length > 0) {
                                const existingAsociados = existingSocio.asociados || [];
                                // Filtrar asociados duplicados por código
                                const uniqueAsociados = asociados.filter(newAsociado =>
                                    !existingAsociados.some(existing => existing.codigo === newAsociado.codigo)
                                );
                                const updatedAsociados = [...existingAsociados, ...uniqueAsociados];
                                await this.sociosService.updateAsociados(existingSocio._id, updatedAsociados);
                            }
                            if (!results.errors.some(e => e.socio === currentSocio.socio)) {
                                results.errors.push({
                                    socio: currentSocio.socio,
                                    error: `El socio ${currentSocio.socio} ya existe en la base de datos`
                                });
                            }
                        } else {
                            const socioData = {
                                ...currentSocio,
                                asociados: asociados
                            };
                            await this.sociosService.create(socioData);
                            results.success.push(currentSocio.socio);
                        }
                    } catch (error) {
                        this.logger.error(`Error procesando socio ${currentSocio.socio}: ${error.message}`);
                        if (!results.errors.some(e => e.socio === currentSocio.socio)) {
                            results.errors.push({
                                socio: currentSocio.socio,
                                error: error.message
                            });
                        }
                    }
                }

                // Verificar si el nuevo socio ya existe antes de procesarlo
                const existingSocio = await this.sociosService.findBySocioCode(codigo);
                if (existingSocio) {
                    existingSocioId = existingSocio._id;
                    if (!results.errors.some(e => e.socio === codigo)) {
                        results.errors.push({
                            socio: codigo,
                            error: `El socio ${codigo} ya existe en la base de datos`
                        });
                    }
                } else {
                    existingSocioId = null;
                }

                const socioData: any = {
                    socio: codigo,
                    nombre: {
                        nombre: sanitizeString(row.getCell(2).value) || '',
                        primerApellido: sanitizeString(row.getCell(3).value) || 'Sin Apellido',
                        segundoApellido: sanitizeString(row.getCell(4).value) || ''
                    },
                    direccion: {
                        calle: sanitizeString(row.getCell(5).value) || 'Sin Calle',
                        numero: sanitizeString(row.getCell(6).value) || 'S/N',
                        piso: sanitizeString(row.getCell(7).value) || '',
                        poblacion: sanitizeString(row.getCell(8).value) || 'Sin Población',
                        cp: sanitizeString(row.getCell(9).value) || '',
                        provincia: sanitizeString(row.getCell(10).value) || ''
                    },
                    contacto: {
                        telefonos: [cleanTelefono(row.getCell(11).value) || ''],
                        emails: [cleanEmail(row.getCell(12).value) || '']
                    },
                    dni: sanitizeString(row.getCell(13).value) || '',
                    casa: Number(row.getCell(14).value) || 1,
                    totalSocios: Number(row.getCell(15).value) || 1,
                    menor3Años: Number(row.getCell(16).value) || 0,
                    cuota: Number(row.getCell(17).value) || 0,
                    banco: {
                        iban: sanitizeString(row.getCell(18).value) || '',
                        entidad: sanitizeString(row.getCell(19).value) || '',
                        oficina: sanitizeString(row.getCell(20).value) || '',
                        dc: sanitizeString(row.getCell(21).value) || '',
                        cuenta: sanitizeString(row.getCell(22).value) || ''
                    },
                    notas: sanitizeString(row.getCell(23).value) || '',
                    observaciones: sanitizeString(row.getCell(24).value) || '',
                    fechaNacimiento: parseToValidDate(row.getCell(25).value),
                    active: true,
                    rgpd: true
                };
                currentSocio = socioData;
                asociados = [];
            } else {
                // Procesar asociado
                const asociado: any = {
                    codigo: codigo,
                    nombre: sanitizeString(row.getCell(2).value) || '',
                    primerApellido: sanitizeString(row.getCell(3).value) || '',
                    segundoApellido: sanitizeString(row.getCell(4).value) || '',
                    telefono: cleanTelefono(row.getCell(11).value) || '',
                    email: cleanEmail(row.getCell(12).value) || '',
                    fechaNacimiento: parseToValidDate(row.getCell(25).value),
                    foto: ''
                };
                if (existingSocioId) {
                    try {
                        const existingSocio = await this.sociosService.findOne(existingSocioId.toString());
                        const existingAsociados = existingSocio.asociados || [];
                        // Verificar si el asociado ya existe
                        if (!existingAsociados.some(a => a.codigo === asociado.codigo)) {
                            const updatedAsociados = [...existingAsociados, asociado];
                            await this.sociosService.updateAsociados(existingSocioId.toString(), updatedAsociados);
                        } else {
                        }
                    } catch (error) {
                        this.logger.error(`Error añadiendo asociado ${codigo} a socio existente: ${error.message}`);
                        results.errors.push({
                            socio: codigo.split('_')[0],
                            error: `Error añadiendo asociado ${codigo}: ${error.message}`
                        });
                    }
                } else if (currentSocio) {
                    // Si no es un socio existente, añadir a la lista de asociados del socio actual
                    asociados.push(asociado);
                } else {
                }
            }
        }

        // Save the last socio
        if (currentSocio) {
            try {
                // Check if socio exists before trying to create it
                const existingSocio = await this.sociosService.findBySocioCode(currentSocio.socio);
                if (existingSocio) {
                    // Actualizar los asociados del socio existente
                    if (asociados.length > 0) {
                        const existingAsociados = existingSocio.asociados || [];
                        // Filtrar asociados duplicados por código
                        const uniqueAsociados = asociados.filter(newAsociado =>
                            !existingAsociados.some(existing => existing.codigo === newAsociado.codigo)
                        );
                        const updatedAsociados = [...existingAsociados, ...uniqueAsociados];
                        await this.sociosService.updateAsociados(existingSocio._id, updatedAsociados);
                    }
                    if (!results.errors.some(e => e.socio === currentSocio.socio)) {
                        results.errors.push({
                            socio: currentSocio.socio,
                            error: `El socio ${currentSocio.socio} ya existe en la base de datos`
                        });
                    }
                } else {
                    const socioData = {
                        ...currentSocio,
                        asociados: asociados
                    };
                    await this.sociosService.create(socioData);
                    results.success.push(currentSocio.socio);
                }
            } catch (error) {
                this.logger.error(`Error procesando último socio ${currentSocio.socio}: ${error.message}`);
                if (!results.errors.some(e => e.socio === currentSocio.socio)) {
                    results.errors.push({
                        socio: currentSocio.socio,
                        error: error.message
                    });
                }
            }
        }

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
            { header: 'Código', key: 'codigo', width: 15 },
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
            { header: 'Menores 3 Años', key: 'menor3Años', width: 15 },
            { header: 'Cuota', key: 'cuota', width: 10 },
            { header: 'IBAN', key: 'iban', width: 30 },
            { header: 'Entidad', key: 'entidad', width: 20 },
            { header: 'Oficina', key: 'oficina', width: 10 },
            { header: 'DC', key: 'dc', width: 5 },
            { header: 'Cuenta', key: 'cuenta', width: 20 },
            { header: 'Notas', key: 'notas', width: 30 },
            { header: 'Observaciones', key: 'observaciones', width: 30 },
            { header: 'Fecha Nacimiento', key: 'fechaNacimiento', width: 15 }
        ];

        // Style the header row
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

        // Add data
        socios.forEach(socio => {
            // Add main socio
            worksheet.addRow({
                codigo: socio.socio,
                nombre: socio.nombre.nombre,
                primerApellido: socio.nombre.primerApellido,
                segundoApellido: socio.nombre.segundoApellido,
                calle: socio.direccion.calle,
                numero: socio.direccion.numero,
                piso: socio.direccion.piso,
                poblacion: socio.direccion.poblacion,
                cp: socio.direccion.cp,
                provincia: socio.direccion.provincia,
                telefono: socio.contacto.telefonos[0] || '',
                email: socio.contacto.emails[0] || '',
                dni: socio.dni,
                casa: socio.casa,
                totalSocios: socio.totalSocios,
                menor3Años: socio.menor3Años,
                cuota: socio.cuota,
                iban: socio.banco?.iban || '',
                entidad: socio.banco?.entidad || '',
                oficina: socio.banco?.oficina || '',
                dc: socio.banco?.dc || '',
                cuenta: socio.banco?.cuenta || '',
                notas: socio.notas || '',
                observaciones: socio.observaciones || '',
                fechaNacimiento: socio.fechaNacimiento
            });

            // Add asociados if any
            if (socio.asociados && socio.asociados.length > 0) {
                socio.asociados.forEach(asociado => {
                    worksheet.addRow({
                        codigo: asociado.codigo,
                        nombre: asociado.nombre,
                        telefono: asociado.telefono || '',
                        fechaNacimiento: asociado.fechaNacimiento ? new Date(asociado.fechaNacimiento).toLocaleDateString() : ''
                    });
                });
            }
        });

        // Set response headers
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=socios.xlsx');

        // Send the file
        await workbook.xlsx.write(res);
        res.end();
    }

    @Get('asociados-invalidos')
    @Roles(UserRole.ADMINISTRADOR)
    async getAsociadosInvalidos() {
        try {
            const asociadosInvalidos = await this.sociosService.getAsociadosInvalidos();
            return asociadosInvalidos;
        } catch (error) {
            this.logger.error(`Error obteniendo asociados inválidos: ${error.message}`);
            throw error;
        }
    }

    @Get(':id')
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA, UserRole.TRABAJADOR, UserRole.TIENDA)
    async findOne(@Param('id') id: string) {
        return this.sociosService.findOne(id);
    }

    @Put(':id')
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA, UserRole.TRABAJADOR, UserRole.TIENDA)
    @UseInterceptors(FileInterceptor('foto'))
    async update(
        @Param('id') id: string,
        @Body() updateSocioDto: UpdateSocioDto,
        @UploadedFile() file?: Express.Multer.File
    ) {

        if (file) {
            const filename = await this.uploadsService.saveFile(file);
            updateSocioDto.foto = filename;
        }

        return this.sociosService.update(id, updateSocioDto);
    }

    @Put(':id/foto')
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA, UserRole.TRABAJADOR, UserRole.TIENDA)
    async updateFoto(
        @Param('id') id: string,
        @Body() body: { filename: string }
    ) {
        try {
            if (!body.filename) {
                throw new BadRequestException('No se ha proporcionado el nombre del archivo');
            }

            const socio = await this.sociosService.updateFoto(id, body.filename);
            return socio;
        } catch (error) {
            this.logger.error('Error updating foto:', error);
            throw error;
        }
    }

    @Delete(':id')
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA)
    async remove(@Param('id') id: string) {
        return this.sociosService.remove(id);
    }

    @Put(':id/toggle-active')
    @Roles(UserRole.ADMINISTRADOR)
    async toggleActive(@Param('id') id: string) {
        return this.sociosService.toggleActive(id);
    }

    @Get(':id/asociados')
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA, UserRole.TRABAJADOR, UserRole.TIENDA)
    async getAsociados(@Param('id') id: string) {
        return this.sociosService.getAsociados(id);
    }

    @Post(':id/asociados')
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA, UserRole.TRABAJADOR, UserRole.TIENDA)
    async addAsociado(
        @Param('id') id: string,
        @Body() createMiembroDto: CreateAsociadoDto
    ) {
        return this.sociosService.addAsociado(id, createMiembroDto);
    }

    @Put(':id/asociados/:asociadoId')
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA, UserRole.TRABAJADOR, UserRole.TIENDA)
    async updateAsociado(
        @Param('id') id: string,
        @Param('asociadoId') asociadoId: string,
        @Body() updateMiembroDto: UpdateAsociadoDto
    ) {
        return this.sociosService.updateAsociado(id, asociadoId, updateMiembroDto);
    }

    @Put(':id/asociados-index/:asociadoIndex')
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA, UserRole.TRABAJADOR)
    async updateAsociadoByIndex(
        @Param('id') id: string,
        @Param('asociadoIndex') asociadoIndex: string,
        @Body() updateMiembroDto: UpdateAsociadoDto & { codigo?: string }
    ) {
        return this.sociosService.updateAsociadoByIndex(id, parseInt(asociadoIndex, 10), updateMiembroDto);
    }

    @Delete(':id/asociados/:asociadoId')
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA)
    async removeAsociado(
        @Param('id') id: string,
        @Param('asociadoId') asociadoId: string
    ) {
        const result = await this.sociosService.removeAsociado(id, asociadoId);
        return result;
    }

    @Put(':id/asociados')
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA, UserRole.TRABAJADOR)
    async updateAsociados(
        @Param('id') id: string,
        @Body() asociados: Asociado[]
    ) {
        return this.sociosService.updateAsociados(id, asociados);
    }

    @Get(':id/productos-consumidos')
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA, UserRole.TRABAJADOR, UserRole.TIENDA)
    async getProductosConsumidos(@Param('id') id: string) {
        return this.sociosService.getProductosConsumidos(id);
    }

    @Post('limpiar-asociados-invalidos')
    @Roles(UserRole.ADMINISTRADOR)
    async limpiarAsociadosInvalidos(@Body() body?: { idsToDelete?: Array<{ socioId: string; asociadoId?: string; asociadoCodigo?: string }> }) {
        try {
            const resultado = await this.sociosService.limpiarAsociadosInvalidos(body?.idsToDelete);
            return {
                message: `Limpieza completada: ${resultado.sociosActualizados} socios actualizados, ${resultado.asociadosEliminados} asociados inválidos eliminados`,
                ...resultado
            };
        } catch (error) {
            this.logger.error(`Error en limpieza de asociados: ${error.message}`);
            throw error;
        }
    }
} 