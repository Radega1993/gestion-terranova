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
    Request,
    UploadedFile,
    UseGuards,
    UseInterceptors,
    Logger,
    BadRequestException
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { InventoryService } from '../services/inventory.service';
import { ProductosRetiradosService } from '../services/productos-retirados.service';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { CreateStockAdditionDto } from '../dto/create-stock-addition.dto';
import { FiltrosStockAdditionsDto } from '../dto/filtros-stock-additions.dto';
import { CreateProductoRetiradoDto } from '../dto/create-producto-retirado.dto';
import { FiltrosProductosRetiradosDto } from '../dto/filtros-productos-retirados.dto';
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

    constructor(
        private readonly inventoryService: InventoryService,
        private readonly productosRetiradosService: ProductosRetiradosService
    ) { }

    @Get('search')
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA, UserRole.TRABAJADOR, UserRole.TIENDA)
    async searchProducts(
        @Query('query') query: string,
        @Query('field') field: 'nombre' | 'tipo' = 'nombre'
    ) {
        return this.inventoryService.searchProducts(query, field);
    }

    @Get('types')
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA, UserRole.TRABAJADOR, UserRole.TIENDA)
    async getTypes() {
        return this.inventoryService.getUniqueTypes();
    }

    @Get('export')
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA, UserRole.TRABAJADOR, UserRole.TIENDA)
    async exportProducts(@Res() res: Response) {
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
        return this.inventoryService.update(updateData.productId, updateData.newData);
    }

    @Post('import/fix-invalid')
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA)
    async fixInvalidData(
        @Body() fixData: { rowIndex: number; field: string; value: any }
    ): Promise<{ success: boolean }> {
        // Aquí podrías implementar la lógica para corregir datos inválidos
        // Por ahora solo devolvemos success
        return { success: true };
    }

    // Endpoints para productos retirados (solo ADMINISTRADOR) - DEBEN ESTAR ANTES DE LAS RUTAS CON :id
    // IMPORTANTE: Las rutas más específicas deben ir ANTES de las rutas con parámetros
    @Post('productos-retirados')
    @Roles(UserRole.ADMINISTRADOR)
    async crearProductoRetirado(
        @Body() createDto: CreateProductoRetiradoDto,
        @Request() req
    ) {
        return this.productosRetiradosService.create(createDto, req.user._id);
    }

    @Get('productos-retirados/resumen')
    @Roles(UserRole.ADMINISTRADOR)
    async obtenerResumenProductosRetirados(
        @Query() filtros: FiltrosProductosRetiradosDto
    ) {
        return this.productosRetiradosService.getResumen(filtros);
    }

    @Get('productos-retirados')
    @Roles(UserRole.ADMINISTRADOR)
    async obtenerProductosRetirados(
        @Query() filtros: FiltrosProductosRetiradosDto
    ) {
        return this.productosRetiradosService.findAll(filtros);
    }

    @Get('productos-retirados/:id')
    @Roles(UserRole.ADMINISTRADOR)
    async obtenerProductoRetirado(@Param('id') id: string) {
        return this.productosRetiradosService.findOne(id);
    }

    @Get('stock-additions')
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA)
    async getStockAdditions(
        @Query() filtros: FiltrosStockAdditionsDto
    ) {
        return this.inventoryService.getStockAdditions(filtros);
    }

    @Post('stock-additions')
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA, UserRole.TRABAJADOR)
    async addStock(
        @Body() createStockAdditionDto: CreateStockAdditionDto,
        @Request() req
    ) {
        return this.inventoryService.addStock(createStockAdditionDto, req.user._id);
    }

    @Get(':id')
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA, UserRole.TRABAJADOR, UserRole.TIENDA)
    async findOne(@Param('id') id: string) {
        return this.inventoryService.findOne(id);
    }

    @Post()
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA, UserRole.TRABAJADOR, UserRole.TIENDA)
    async create(@Body() createInventoryDto: any) {
        return this.inventoryService.create(createInventoryDto);
    }

    @Put(':id')
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA)
    async update(@Param('id') id: string, @Body() updateInventoryDto: any) {
        return this.inventoryService.update(id, updateInventoryDto);
    }

    @Delete(':id')
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA)
    async remove(@Param('id') id: string) {
        return this.inventoryService.remove(id);
    }

    @Put(':id/toggle-active')
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA)
    async toggleActive(@Param('id') id: string) {
        return this.inventoryService.toggleActive(id);
    }

}
