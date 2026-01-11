import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ProductoRetirado, ProductoRetiradoDocument } from '../schemas/producto-retirado.schema';
import { Product, ProductDocument } from '../schemas/product.schema';
import { CreateProductoRetiradoDto } from '../dto/create-producto-retirado.dto';
import { FiltrosProductosRetiradosDto } from '../dto/filtros-productos-retirados.dto';

@Injectable()
export class ProductosRetiradosService {
    private readonly logger = new Logger(ProductosRetiradosService.name);

    constructor(
        @InjectModel(ProductoRetirado.name) private productoRetiradoModel: Model<ProductoRetiradoDocument>,
        @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    ) { }

    async create(createDto: CreateProductoRetiradoDto, userId: string): Promise<ProductoRetiradoDocument> {
        // Verificar que el producto existe
        const producto = await this.productModel.findById(createDto.productoId).exec();
        if (!producto) {
            throw new NotFoundException(`Producto con ID ${createDto.productoId} no encontrado`);
        }

        // Verificar que hay suficiente stock
        if (producto.stock_actual < createDto.cantidad) {
            throw new BadRequestException(
                `No hay suficiente stock. Stock actual: ${producto.stock_actual}, cantidad a retirar: ${createDto.cantidad}`
            );
        }

        // Crear el registro de producto retirado
        const productoRetirado = new this.productoRetiradoModel({
            producto: new Types.ObjectId(createDto.productoId),
            cantidad: createDto.cantidad,
            motivo: createDto.motivo,
            usuarioRegistro: new Types.ObjectId(userId),
            fechaRetiro: createDto.fechaRetiro ? new Date(createDto.fechaRetiro) : new Date(),
            observaciones: createDto.observaciones
        });

        // Reducir el stock del producto
        producto.stock_actual -= createDto.cantidad;
        await producto.save();

        const saved = await productoRetirado.save();

        return this.productoRetiradoModel.findById(saved._id)
            .populate('producto', 'nombre tipo unidad_medida precio_compra_unitario')
            .populate('usuarioRegistro', 'username')
            .exec();
    }

    async findAll(filtros: FiltrosProductosRetiradosDto): Promise<ProductoRetiradoDocument[]> {
        const query: any = {};

        if (filtros.fechaInicio || filtros.fechaFin) {
            query.fechaRetiro = {};
            if (filtros.fechaInicio) {
                query.fechaRetiro.$gte = new Date(filtros.fechaInicio);
            }
            if (filtros.fechaFin) {
                const fechaFin = new Date(filtros.fechaFin);
                fechaFin.setHours(23, 59, 59, 999);
                query.fechaRetiro.$lte = fechaFin;
            }
        }

        if (filtros.productoId) {
            query.producto = new Types.ObjectId(filtros.productoId);
        }

        if (filtros.motivo) {
            query.motivo = { $regex: filtros.motivo, $options: 'i' };
        }

        if (filtros.usuarioRegistroId) {
            query.usuarioRegistro = new Types.ObjectId(filtros.usuarioRegistroId);
        }

        return this.productoRetiradoModel.find(query)
            .populate('producto', 'nombre tipo unidad_medida precio_compra_unitario')
            .populate('usuarioRegistro', 'username')
            .sort({ fechaRetiro: -1 })
            .exec();
    }

    async findOne(id: string): Promise<ProductoRetiradoDocument> {
        const productoRetirado = await this.productoRetiradoModel.findById(id)
            .populate('producto', 'nombre tipo unidad_medida precio_compra_unitario')
            .populate('usuarioRegistro', 'username')
            .exec();

        if (!productoRetirado) {
            throw new NotFoundException(`Producto retirado con ID ${id} no encontrado`);
        }

        return productoRetirado;
    }

    async getResumen(filtros: FiltrosProductosRetiradosDto): Promise<any> {
        const productosRetirados = await this.findAll(filtros);

        const resumen = {
            totalRegistros: productosRetirados.length,
            totalCantidad: productosRetirados.reduce((sum, pr) => sum + pr.cantidad, 0),
            porMotivo: {} as Record<string, { cantidad: number }>,
            porProducto: {} as Record<string, { cantidad: number; nombre: string }>
        };

        productosRetirados.forEach(pr => {
            // Agrupar por motivo
            if (!resumen.porMotivo[pr.motivo]) {
                resumen.porMotivo[pr.motivo] = { cantidad: 0 };
            }
            resumen.porMotivo[pr.motivo].cantidad += pr.cantidad;

            // Agrupar por producto
            const productoId = (pr.producto as any)._id?.toString() || (pr.producto as any).toString();
            const productoNombre = (pr.producto as any).nombre || 'Desconocido';
            if (!resumen.porProducto[productoId]) {
                resumen.porProducto[productoId] = { cantidad: 0, nombre: productoNombre };
            }
            resumen.porProducto[productoId].cantidad += pr.cantidad;
        });

        return resumen;
    }
}

