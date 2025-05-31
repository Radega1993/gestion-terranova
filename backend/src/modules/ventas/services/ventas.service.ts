import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Venta } from '../schemas/venta.schema';
import { CreateVentaDto } from '../dto/create-venta.dto';
import { PagoVentaDto } from '../dto/pago-venta.dto';
import { Product } from '../../inventory/schemas/product.schema';
import { VentaFiltersDto } from '../dto/venta-filters.dto';

@Injectable()
export class VentasService {
    private readonly logger = new Logger(VentasService.name);

    constructor(
        @InjectModel(Venta.name) private ventaModel: Model<Venta>,
        @InjectModel(Product.name) private productModel: Model<Product>
    ) { }

    private buildDateFilter(filters: VentaFiltersDto) {
        const dateFilter: any = {};
        if (filters.fechaInicio || filters.fechaFin) {
            dateFilter.createdAt = {};
            if (filters.fechaInicio) {
                dateFilter.createdAt.$gte = new Date(filters.fechaInicio);
            }
            if (filters.fechaFin) {
                dateFilter.createdAt.$lte = new Date(filters.fechaFin);
            }
        }
        return dateFilter;
    }

    async findAll(filters: VentaFiltersDto): Promise<Venta[]> {
        const dateFilter = this.buildDateFilter(filters);
        return this.ventaModel.find(dateFilter)
            .sort({ createdAt: -1 })
            .exec();
    }

    async findByCliente(codigoCliente: string, filters: VentaFiltersDto): Promise<Venta[]> {
        const dateFilter = this.buildDateFilter(filters);
        return this.ventaModel.find({
            codigoSocio: codigoCliente,
            ...dateFilter
        })
            .sort({ createdAt: -1 })
            .exec();
    }

    async findByUsuario(userId: string, filters: VentaFiltersDto): Promise<Venta[]> {
        const dateFilter = this.buildDateFilter(filters);
        return this.ventaModel.find({
            usuario: userId,
            ...dateFilter
        })
            .sort({ createdAt: -1 })
            .exec();
    }

    async findPendientes(filters: VentaFiltersDto): Promise<Venta[]> {
        const dateFilter = this.buildDateFilter(filters);
        return this.ventaModel.find({
            estado: { $in: ['PENDIENTE', 'PAGADO_PARCIAL'] },
            ...dateFilter
        })
            .sort({ createdAt: -1 })
            .exec();
    }

    async create(createVentaDto: CreateVentaDto, userId: string): Promise<Venta> {
        try {
            // Validar que haya observaciones si el pago es parcial
            if (createVentaDto.pagado < createVentaDto.total && !createVentaDto.observaciones) {
                throw new BadRequestException('Las observaciones son obligatorias cuando el pago es parcial');
            }

            // Ajustar el monto pagado si excede el total
            if (createVentaDto.pagado > createVentaDto.total) {
                createVentaDto.pagado = createVentaDto.total;
            }

            // Calcular el estado basado en el pago
            let estado = 'PENDIENTE';
            if (createVentaDto.pagado >= createVentaDto.total) {
                estado = 'PAGADO';
            } else if (createVentaDto.pagado > 0) {
                estado = 'PAGADO_PARCIAL';
            }

            // Actualizar el stock de los productos y obtener sus categorías
            const productosConCategoria = await Promise.all(
                createVentaDto.productos.map(async (producto) => {
                    const productoEncontrado = await this.productModel.findOne({ nombre: producto.nombre });
                    if (!productoEncontrado) {
                        throw new BadRequestException(`Producto no encontrado: ${producto.nombre}`);
                    }

                    if (productoEncontrado.stock_actual < producto.unidades) {
                        throw new BadRequestException(`Stock insuficiente para ${producto.nombre}`);
                    }

                    productoEncontrado.stock_actual -= producto.unidades;
                    await productoEncontrado.save();

                    return {
                        ...producto,
                        categoria: productoEncontrado.tipo
                    };
                })
            );

            const venta = new this.ventaModel({
                ...createVentaDto,
                productos: productosConCategoria,
                usuario: userId,
                estado
            });

            const savedVenta = await venta.save();
            this.logger.log(`Venta creada con ID: ${savedVenta._id}`);
            return savedVenta;
        } catch (error) {
            this.logger.error(`Error al crear venta: ${error.message}`, error.stack);
            throw error;
        }
    }

    async registrarPago(id: string, pagoVentaDto: PagoVentaDto) {
        const venta = await this.ventaModel.findById(id);
        if (!venta) {
            throw new NotFoundException(`Venta ${id} no encontrada`);
        }

        const pendiente = venta.total - venta.pagado;
        if (pagoVentaDto.pagado > pendiente) {
            throw new BadRequestException('El pago excede el monto pendiente');
        }

        const nuevoPagado = venta.pagado + pagoVentaDto.pagado;
        const nuevoEstado = nuevoPagado === venta.total ? 'PAGADO' : 'PAGADO_PARCIAL';

        // Registrar el pago en el historial
        const pago = {
            fecha: new Date(),
            monto: pagoVentaDto.pagado,
            metodoPago: pagoVentaDto.metodoPago,
        };

        venta.pagos = venta.pagos || [];
        venta.pagos.push(pago);

        // Actualizar la venta
        venta.pagado = nuevoPagado;
        venta.estado = nuevoEstado;

        return venta.save();
    }
} 