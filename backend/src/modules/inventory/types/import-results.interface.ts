import { ProductDocument } from '../schemas/product.schema';
import { CreateProductDto } from '../dto/create-product.dto';

export interface ImportValidationError {
    rowIndex: number;
    nombre: string;
    tipo: string;
    field: string;
    value: any;
    error: string;
    isValidationError: boolean;
}

export interface DuplicateProduct {
    rowIndex: number;
    existing: ProductDocument;
    newData: CreateProductDto;
}

export interface ImportResults {
    success: number;
    errors: ImportValidationError[];
    duplicates: DuplicateProduct[];
    invalidData: ImportValidationError[];
} 