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

@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventoryController {
    private readonly logger = new Logger(InventoryController.name);

    constructor(private readonly inventoryService: InventoryService) { }

    @Get('search')
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA, UserRole.TRABAJADOR)
    async searchProducts(
        @Query('query') query: string,
        @Query('field') field: 'nombre' | 'tipo' = 'nombre'
    ) {
        this.logger.debug(`Searching products with ${field}: ${query}`);
        return this.inventoryService.searchProducts(query, field);
    }

    @Get('types')
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA, UserRole.TRABAJADOR)
    async getTypes() {
        this.logger.debug('Fetching product types');
        return this.inventoryService.getUniqueTypes();
    }

    @Get('export')
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA, UserRole.TRABAJADOR)
    async exportToExcel(@Res() res: Response) {
        this.logger.debug('Exporting products to Excel');
        try {
            const buffer = await this.inventoryService.exportToExcel();
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
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA, UserRole.TRABAJADOR)
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
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA, UserRole.TRABAJADOR)
    async findOne(@Param('id') id: string) {
        this.logger.debug(`Fetching product with ID: ${id}`);
        return this.inventoryService.findOne(id);
    }

    @Post()
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA, UserRole.TRABAJADOR)
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
} 