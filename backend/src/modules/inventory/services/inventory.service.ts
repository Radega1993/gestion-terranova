import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from '../schemas/product.schema';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { ImportResults } from '../types/import-results.interface';
import * as XLSX from 'xlsx';

interface ImportValidationError {
    rowIndex: number;
    nombre: string;
    tipo: string;
    field: string;
    value: any;
    error: string;
    isValidationError: boolean;
}

interface DuplicateProduct {
    rowIndex: number;
    existing: ProductDocument;
    newData: CreateProductDto;
}

interface ImportResponse {
    success: number;
    errors: ImportValidationError[];
    duplicates: DuplicateProduct[];
    invalidData: ImportValidationError[];
}

@Injectable()
export class InventoryService {
    private readonly logger = new Logger(InventoryService.name);

    constructor(
        @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    ) { }

    async findAll(): Promise<ProductDocument[]> {
        return this.productModel.find().exec();
    }

    async findOne(id: string): Promise<ProductDocument> {
        const product = await this.productModel.findById(id).exec();
        if (!product) {
            throw new NotFoundException(`Producto con ID ${id} no encontrado`);
        }
        return product;
    }

    async create(createProductDto: CreateProductDto): Promise<ProductDocument> {
        const createdProduct = new this.productModel({
            ...createProductDto,
            activo: true
        });
        return createdProduct.save();
    }

    async update(id: string, updateProductDto: UpdateProductDto): Promise<ProductDocument> {
        const existingProduct = await this.productModel
            .findByIdAndUpdate(id, updateProductDto, { new: true })
            .exec();

        if (!existingProduct) {
            throw new NotFoundException(`Producto con ID ${id} no encontrado`);
        }

        return existingProduct;
    }

    async remove(id: string): Promise<ProductDocument> {
        const deletedProduct = await this.productModel
            .findByIdAndDelete(id)
            .exec();

        if (!deletedProduct) {
            throw new NotFoundException(`Producto con ID ${id} no encontrado`);
        }

        return deletedProduct;
    }

    async toggleActive(id: string): Promise<ProductDocument> {
        const product = await this.productModel.findById(id);
        if (!product) {
            throw new Error('Producto no encontrado');
        }
        product.activo = !product.activo;
        return product.save();
    }

    async importFromExcel(file: Express.Multer.File): Promise<ImportResponse> {

        if (!file?.buffer || !(file.buffer instanceof Buffer)) {
            this.logger.error('Error: Buffer del archivo no válido o no presente', {
                hasFile: !!file,
                hasBuffer: !!file?.buffer,
                bufferType: file?.buffer ? typeof file.buffer : 'undefined',
                isBuffer: file?.buffer instanceof Buffer
            });
            throw new BadRequestException('Archivo no válido o corrupto');
        }

        try {
            const workbook = XLSX.read(file.buffer, { type: 'buffer' });
            if (!workbook.SheetNames.length) {
                throw new BadRequestException('El archivo Excel está vacío');
            }

            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const data = XLSX.utils.sheet_to_json(worksheet, {
                raw: false,
                defval: '',
                header: ['Nombre', 'Tipo', 'Unidad de Medida', 'Stock Actual', 'Precio Compra Unitario']
            }) as Record<string, any>[];


            const importResponse: ImportResponse = {
                success: 0,
                errors: [],
                duplicates: [],
                invalidData: []
            };

            // Saltamos la primera fila si contiene encabezados
            const startIndex = this.hasHeaders(data) ? 1 : 0;

            for (let i = startIndex; i < data.length; i++) {
                const row = data[i];
                try {
                    const productData = await this.validateAndFormatProductData(row, i);

                    // Verificar si el producto ya existe
                    const existingProduct = await this.productModel.findOne({
                        nombre: productData.nombre,
                        tipo: productData.tipo
                    });

                    if (existingProduct) {
                        // Si el producto es idéntico, lo ignoramos
                        if (this.areProductsIdentical(existingProduct, productData)) {
                            continue;
                        }

                        // Si hay diferencias, lo agregamos a la lista de duplicados
                        importResponse.duplicates.push({
                            rowIndex: i,
                            existing: existingProduct,
                            newData: productData
                        });
                        continue;
                    }

                    // Si no hay errores ni duplicados, creamos el producto
                    await this.create(productData);
                    importResponse.success++;

                } catch (error) {
                    if (error.isValidationError) {
                        importResponse.invalidData.push(error);
                    } else {
                        importResponse.errors.push({
                            rowIndex: i,
                            nombre: row['Nombre'] || '',
                            tipo: row['Tipo'] || '',
                            field: 'unknown',
                            value: null,
                            error: error.message,
                            isValidationError: false
                        });
                    }
                }
            }

            return importResponse;
        } catch (error) {
            this.logger.error('Error procesando archivo Excel:', error);
            throw new BadRequestException(`Error procesando archivo Excel: ${error.message}`);
        }
    }

    private hasHeaders(data: Record<string, any>[]): boolean {
        if (data.length === 0) return false;
        const firstRow = data[0];
        return firstRow['Nombre']?.toLowerCase().includes('nombre') ||
            firstRow['Tipo']?.toLowerCase().includes('tipo') ||
            firstRow['Unidad de Medida']?.toLowerCase().includes('unidad') ||
            firstRow['Stock Actual']?.toLowerCase().includes('stock') ||
            firstRow['Precio Compra Unitario']?.toLowerCase().includes('precio');
    }

    private async validateAndFormatProductData(row: Record<string, any>, rowIndex: number): Promise<CreateProductDto> {
        const nombre = this.validateField('Nombre', row['Nombre'], rowIndex);
        const tipo = this.validateField('Tipo', row['Tipo'], rowIndex);
        const unidad_medida = this.validateField('Unidad de Medida', row['Unidad de Medida'], rowIndex);

        const stock_actual = this.validateNumericField(
            'Stock Actual',
            row['Stock Actual'],
            rowIndex,
            0
        );

        const precio_compra_unitario = this.validateNumericField(
            'Precio Compra Unitario',
            row['Precio Compra Unitario'],
            rowIndex,
            0
        );

        return {
            nombre,
            tipo,
            unidad_medida,
            stock_actual,
            precio_compra_unitario
        };
    }

    private validateField(fieldName: string, value: any, rowIndex: number): string {
        if (!value || value.toString().trim() === '') {
            const error: ImportValidationError = {
                rowIndex,
                nombre: '',
                tipo: '',
                field: fieldName,
                value,
                error: `El campo ${fieldName} es requerido`,
                isValidationError: true
            };
            throw error;
        }
        return value.toString().trim();
    }

    private validateNumericField(fieldName: string, value: any, rowIndex: number, min: number): number {
        const numValue = Number(value);
        if (isNaN(numValue)) {
            const error: ImportValidationError = {
                rowIndex,
                nombre: '',
                tipo: '',
                field: fieldName,
                value,
                error: `El campo ${fieldName} debe ser un número`,
                isValidationError: true
            };
            throw error;
        }
        if (numValue < min) {
            const error: ImportValidationError = {
                rowIndex,
                nombre: '',
                tipo: '',
                field: fieldName,
                value,
                error: `El campo ${fieldName} debe ser mayor o igual a ${min}`,
                isValidationError: true
            };
            throw error;
        }
        return numValue;
    }

    private areProductsIdentical(existing: ProductDocument, newData: CreateProductDto): boolean {
        return existing.nombre === newData.nombre &&
            existing.tipo === newData.tipo &&
            existing.unidad_medida === newData.unidad_medida &&
            existing.stock_actual === newData.stock_actual &&
            existing.precio_compra_unitario === newData.precio_compra_unitario;
    }

    async exportToExcel(): Promise<Buffer> {
        const products = await this.findAll();
        const data = products.map((product: ProductDocument) => ({
            ID: product._id.toString(),
            Nombre: product.nombre,
            Tipo: product.tipo,
            'Unidad de Medida': product.unidad_medida,
            'Stock Actual': product.stock_actual,
            'Precio Compra Unitario': product.precio_compra_unitario,
            Activo: product.activo,
            'Fecha de Creación': product.createdAt.toISOString(),
            'Última Actualización': product.updatedAt.toISOString(),
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Productos');

        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        return buffer;
    }

    async getUniqueTypes(): Promise<string[]> {
        const types = await this.productModel.distinct('tipo');
        return types;
    }

    async searchProducts(query: string, field: 'nombre' | 'tipo' = 'nombre'): Promise<ProductDocument[]> {

        if (!query) {
            return [];
        }

        const searchRegex = new RegExp(query, 'i');
        const searchQuery = { [field]: searchRegex, activo: true };

        try {
            const products = await this.productModel
                .find(searchQuery)
                .sort({ [field]: 1 })
                .exec();

            return products;
        } catch (error) {
            this.logger.error(`Error searching products: ${error.message}`);
            throw new BadRequestException(`Error searching products: ${error.message}`);
        }
    }

    async findByName(nombre: string): Promise<ProductDocument | null> {
        return this.productModel.findOne({ nombre }).exec();
    }
} 