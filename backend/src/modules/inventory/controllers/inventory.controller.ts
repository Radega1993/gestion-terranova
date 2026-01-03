import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Put,
    Query,
    Res,
    UploadedFile,
    UseGuards,
    UseInterceptors,
    Logger,
    BadRequestException
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { InventoryService } from '../services/inventory.service';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../users/types/user-roles.enum';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { ImportResults } from '../types/import-results.interface';
import { ProductDocument } from '../schemas/product.schema';
import { extname } from 'path';
import { memoryStorage } from 'multer';
import * as ExcelJS from 'exceljs';

@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventoryController {
    private readonly logger = new Logger(InventoryController.name);

    constructor(private readonly inventoryService: InventoryService) { }

    @Get('search')
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA, UserRole.TRABAJADOR, UserRole.TIENDA)
    async searchProducts(
        @Query('query') query: string,
        @Query('field') field: 'nombre' | 'tipo' = 'nombre'
    ) {
        this.logger.debug(`Searching products with ${field}: ${query}`);
        return this.inventoryService.searchProducts(query, field);
    }

    @Get('types')
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA, UserRole.TRABAJADOR, UserRole.TIENDA)
    async getTypes() {
        this.logger.debug('Fetching product types');
        return this.inventoryService.getUniqueTypes();
    }

    @Get('export')
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA, UserRole.TRABAJADOR, UserRole.TIENDA)
    async exportProducts(@Res() res: Response) {
        this.logger.debug('Exporting products to Excel');
        try {
            const products = await this.inventoryService.findAll();
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Productos');

            // Configurar columnas
            worksheet.columns = [
                { header: 'Nombre', key: 'nombre', width: 30 },
                { header: 'Tipo', key: 'tipo', width: 20 },
                { header: 'Unidad de Medida', key: 'unidad_medida', width: 15 },
                { header: 'Stock Actual', key: 'stock_actual', width: 15 },
                { header: 'Precio Compra Unitario', key: 'precio_compra_unitario', width: 20 }
            ];

            // Estilo para el encabezado
            worksheet.getRow(1).font = { bold: true };
            worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

            // Añadir datos
            products.forEach(product => {
                worksheet.addRow({
                    nombre: product.nombre,
                    tipo: product.tipo,
                    unidad_medida: product.unidad_medida,
                    stock_actual: product.stock_actual,
                    precio_compra_unitario: product.precio_compra_unitario
                });
            });

            // Generar buffer
            const buffer = await workbook.xlsx.writeBuffer();

            res.set({
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': 'attachment; filename=productos.xlsx',
            });
            res.send(buffer);
        } catch (error) {
            this.logger.error('Error exporting to Excel:', error);
            res.status(500).json({ message: 'Error al exportar a Excel' });
        }
    }

    @Get()
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA, UserRole.TRABAJADOR, UserRole.TIENDA)
    async findAll() {
        this.logger.debug('Fetching all products');
        return this.inventoryService.findAll();
    }

    @Post('import')
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA)
    @UseInterceptors(FileInterceptor('file', {
        storage: memoryStorage(),
        fileFilter: (req: any, file: Express.Multer.File, callback: (error: Error | null, acceptFile: boolean) => void) => {
            if (!file) {
                return callback(new BadRequestException('No se proporcionó ningún archivo'), false);
            }

            const ext = extname(file.originalname).toLowerCase();
            if (ext !== '.xlsx' && ext !== '.xls') {
                return callback(new BadRequestException('Solo se permiten archivos Excel (.xlsx o .xls)'), false);
            }

            callback(null, true);
        },
        limits: {
            fileSize: 5 * 1024 * 1024, // 5MB
            files: 1
        }
    }))
    async importFromExcel(
        @UploadedFile() file: Express.Multer.File
    ): Promise<ImportResults> {
        if (!file) {
            throw new BadRequestException('No se proporcionó ningún archivo');
        }

        try {
            return await this.inventoryService.importFromExcel(file);
        } catch (error) {
            this.logger.error('Error importando desde Excel:', error);
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException(error.message || 'Error al procesar el archivo');
        }
    }

    @Post('import/update')
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA)
    async updateDuplicateProduct(
        @Body() updateData: { rowIndex: number; productId: string; newData: CreateProductDto }
    ): Promise<ProductDocument> {
        this.logger.debug(`Updating duplicate product with ID: ${updateData.productId}`);
        return this.inventoryService.update(updateData.productId, updateData.newData);
    }

    @Post('import/fix-invalid')
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA)
    async fixInvalidData(
        @Body() fixData: { rowIndex: number; field: string; value: any }
    ): Promise<{ success: boolean }> {
        this.logger.debug(`Fixing invalid data for row ${fixData.rowIndex}, field: ${fixData.field}`);
        // Aquí podrías implementar la lógica para corregir datos inválidos
        // Por ahora solo devolvemos success
        return { success: true };
    }

    @Get(':id')
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA, UserRole.TRABAJADOR, UserRole.TIENDA)
    async findOne(@Param('id') id: string) {
        this.logger.debug(`Fetching product with ID: ${id}`);
        return this.inventoryService.findOne(id);
    }

    @Post()
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA, UserRole.TRABAJADOR, UserRole.TIENDA)
    async create(@Body() createInventoryDto: any) {
        this.logger.debug('Creating new product');
        return this.inventoryService.create(createInventoryDto);
    }

    @Put(':id')
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA)
    async update(@Param('id') id: string, @Body() updateInventoryDto: any) {
        this.logger.debug(`Updating product with ID: ${id}`);
        return this.inventoryService.update(id, updateInventoryDto);
    }

    @Delete(':id')
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA)
    async remove(@Param('id') id: string) {
        this.logger.debug(`Removing product with ID: ${id}`);
        return this.inventoryService.remove(id);
    }

    @Put(':id/toggle-active')
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA)
    async toggleActive(@Param('id') id: string) {
        this.logger.debug(`Toggling active status for product with ID: ${id}`);
        return this.inventoryService.toggleActive(id);
    }

    @Post('import')
    @Roles(UserRole.ADMINISTRADOR)
    @UseInterceptors(FileInterceptor('file'))
    async importProducts(@UploadedFile() file: Express.Multer.File) {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(file.buffer);
        const worksheet = workbook.getWorksheet(1);

        const results = {
            success: [],
            errors: []
        };

        // Función para sanitizar strings y evitar errores de UTF-8
        function sanitizeString(value: any): string {
            if (!value) return '';
            try {
                return String(value)
                    .replace(/[^\x20-\x7EáéíóúÁÉÍÓÚñÑüÜçÇ]/g, '') // Solo caracteres imprimibles y acentuados comunes
                    .trim();
            } catch {
                return '';
            }
        }

        // Procesar productos
        for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
            const row = worksheet.getRow(rowNumber);

            // Verificar si la fila tiene datos
            if (!row.getCell(1).value) continue;

            const productData = {
                nombre: sanitizeString(row.getCell(1).value),
                tipo: sanitizeString(row.getCell(2).value),
                unidad_medida: sanitizeString(row.getCell(3).value),
                stock_actual: Number(row.getCell(4).value) || 0,
                precio_compra_unitario: Number(row.getCell(5).value) || 0,
                activo: row.getCell(6).value?.toString()?.toLowerCase() === 'sí'
            };

            try {
                // Validar datos requeridos
                if (!productData.nombre) {
                    throw new Error('El nombre es obligatorio');
                }

                if (!productData.tipo) {
                    throw new Error('El tipo es obligatorio');
                }

                if (!productData.unidad_medida) {
                    throw new Error('La unidad de medida es obligatoria');
                }

                // Buscar si existe un producto con el mismo nombre
                const existingProduct = await this.inventoryService.findByName(productData.nombre);
                if (existingProduct) {
                    // Actualizar producto existente
                    await this.inventoryService.update(existingProduct._id.toString(), productData);
                    results.success.push(productData.nombre);
                } else {
                    // Crear nuevo producto
                    await this.inventoryService.create(productData);
                    results.success.push(productData.nombre);
                }
            } catch (error) {
                results.errors.push({
                    producto: productData.nombre || `Fila ${rowNumber}`,
                    error: error.message
                });
            }
        }

        return {
            message: `Importación ${results.success.length > 0 ? 'parcialmente ' : ''}exitosa`,
            success: results.success,
            errors: results.errors
        };
    }
} 