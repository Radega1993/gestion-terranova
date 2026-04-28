import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Devolucion, DevolucionDocument, EstadoDevolucion } from '../schemas/devolucion.schema';
import { CreateDevolucionDto } from '../dto/create-devolucion.dto';
import { UpdateDevolucionDto } from '../dto/update-devolucion.dto';
import { Venta } from '../../ventas/schemas/venta.schema';
import { Product } from '../../inventory/schemas/product.schema';
import { UsersService } from '../../users/users.service';
import { TiendasService } from '../../tiendas/services/tiendas.service';

@Injectable()
export class DevolucionesService {
    private readonly logger = new Logger(DevolucionesService.name);

    constructor(
        @InjectModel(Devolucion.name) private devolucionModel: Model<DevolucionDocument>,
        @InjectModel(Venta.name) private ventaModel: Model<Venta>,
        @InjectModel(Product.name) private productModel: Model<Product>,
        private usersService: UsersService,
        private tiendasService: TiendasService
    ) { }

    async create(createDevolucionDto: CreateDevolucionDto, userId: string, userRole: string): Promise<DevolucionDocument> {
        const normalizedRole = String(userRole || '').trim().toUpperCase();

        // Validar que la venta existe
        const venta = await this.ventaModel.findById(createDevolucionDto.venta).exec();
        if (!venta) {
            throw new NotFoundException(`Venta con ID ${createDevolucionDto.venta} no encontrada`);
        }

        // ADMINISTRADOR, JUNTA y TRABAJADOR pueden crear devoluciones
        if (!['ADMINISTRADOR', 'JUNTA', 'TRABAJADOR'].includes(normalizedRole)) {
            throw new BadRequestException(`No tiene permiso para crear devoluciones (rol: ${normalizedRole || 'desconocido'})`);
        }

        // Para TRABAJADOR, solo permitir devoluciones de ventas realizadas por él
        if (normalizedRole === 'TRABAJADOR' && venta.usuario?.toString() !== String(userId)) {
            throw new BadRequestException('Solo puede crear devoluciones de ventas realizadas por su usuario');
        }

        // Las devoluciones solo se permiten para ventas del día actual
        const fechaVenta = new Date((venta as any).createdAt);
        const inicioHoy = new Date();
        inicioHoy.setHours(0, 0, 0, 0);
        const finHoy = new Date();
        finHoy.setHours(23, 59, 59, 999);
        if (fechaVenta < inicioHoy || fechaVenta > finHoy) {
            throw new BadRequestException('Solo se permiten devoluciones de ventas realizadas en el día actual');
        }

        // Validar productos a devolver
        const productosVenta = venta.productos;
        const productosDevolucion = createDevolucionDto.productos;

        // Evitar devoluciones duplicadas/infinitas:
        // no permitir devolver más cantidad de la vendida sumando devoluciones previas (excepto canceladas).
        const devolucionesPrevias = await this.devolucionModel.find({
            venta: venta._id,
            estado: { $ne: EstadoDevolucion.CANCELADA }
        }).exec();
        const devueltoPorProducto = new Map<string, number>();
        for (const devolucionPrevia of devolucionesPrevias) {
            for (const producto of devolucionPrevia.productos) {
                devueltoPorProducto.set(
                    producto.nombre,
                    (devueltoPorProducto.get(producto.nombre) || 0) + producto.cantidad
                );
            }
        }

        for (const productoDev of productosDevolucion) {
            const productoVenta = productosVenta.find(p => p.nombre === productoDev.nombre);
            
            if (!productoVenta) {
                throw new BadRequestException(`El producto "${productoDev.nombre}" no existe en la venta`);
            }

            if (productoDev.cantidad > productoVenta.unidades) {
                throw new BadRequestException(
                    `La cantidad a devolver (${productoDev.cantidad}) excede la cantidad vendida (${productoVenta.unidades}) para el producto "${productoDev.nombre}"`
                );
            }

            const yaDevuelto = devueltoPorProducto.get(productoDev.nombre) || 0;
            const cantidadTotalDevuelta = yaDevuelto + productoDev.cantidad;
            if (cantidadTotalDevuelta > productoVenta.unidades) {
                throw new BadRequestException(
                    `El producto "${productoDev.nombre}" ya tiene devoluciones registradas (${yaDevuelto}). No puede superar las ${productoVenta.unidades} unidades vendidas`
                );
            }
        }

        // Validar que el total de devolución coincide
        const totalCalculado = productosDevolucion.reduce((sum, p) => sum + p.total, 0);
        if (Math.abs(totalCalculado - createDevolucionDto.totalDevolucion) > 0.01) {
            throw new BadRequestException('El total de devolución no coincide con la suma de los productos');
        }

        // Crear la devolución
        const devolucion = new this.devolucionModel({
            ...createDevolucionDto,
            venta: venta._id,
            usuario: userId,
            estado: EstadoDevolucion.PENDIENTE
        });

        return devolucion.save();
    }

    async findAll(filters?: { fechaInicio?: Date; fechaFin?: Date; ventaId?: string; usuarioId?: string }): Promise<DevolucionDocument[]> {
        const query: any = {};

        if (filters?.fechaInicio || filters?.fechaFin) {
            query.createdAt = {};
            if (filters.fechaInicio) {
                query.createdAt.$gte = filters.fechaInicio;
            }
            if (filters.fechaFin) {
                query.createdAt.$lte = filters.fechaFin;
            }
        }

        if (filters?.ventaId) {
            query.venta = filters.ventaId;
        }

        if (filters?.usuarioId) {
            query.usuario = filters.usuarioId;
        }

        return this.devolucionModel.find(query)
            .populate('venta', 'codigoSocio nombreSocio total')
            .populate('usuario', 'username nombre')
            .populate('trabajador', 'nombre identificador')
            .populate('procesadoPor', 'username nombre')
            .sort({ createdAt: -1 })
            .exec();
    }

    async findOne(id: string): Promise<DevolucionDocument> {
        const devolucion = await this.devolucionModel.findById(id)
            .populate('venta', 'codigoSocio nombreSocio total productos')
            .populate('usuario', 'username nombre')
            .populate('trabajador', 'nombre identificador')
            .populate('procesadoPor', 'username nombre')
            .exec();

        if (!devolucion) {
            throw new NotFoundException(`Devolución con ID ${id} no encontrada`);
        }

        return devolucion;
    }

    async update(id: string, updateDevolucionDto: UpdateDevolucionDto): Promise<DevolucionDocument> {
        const devolucion = await this.devolucionModel.findByIdAndUpdate(
            id,
            updateDevolucionDto,
            { new: true }
        )
            .populate('venta', 'codigoSocio nombreSocio total')
            .populate('usuario', 'username nombre')
            .populate('trabajador', 'nombre identificador')
            .exec();

        if (!devolucion) {
            throw new NotFoundException(`Devolución con ID ${id} no encontrada`);
        }

        return devolucion;
    }

    async procesar(id: string, usuarioId: string): Promise<DevolucionDocument> {
        const devolucion = await this.devolucionModel.findById(id).exec();
        
        if (!devolucion) {
            throw new NotFoundException(`Devolución con ID ${id} no encontrada`);
        }

        if (devolucion.estado === EstadoDevolucion.PROCESADA) {
            throw new BadRequestException('La devolución ya está procesada');
        }

        if (devolucion.estado === EstadoDevolucion.CANCELADA) {
            throw new BadRequestException('No se puede procesar una devolución cancelada');
        }

        // Actualizar stock de productos
        for (const productoDev of devolucion.productos) {
            // Buscar producto por nombre (case insensitive)
            const product = await this.productModel.findOne({ 
                nombre: { $regex: new RegExp(`^${productoDev.nombre}$`, 'i') }
            }).exec();
            
            if (product) {
                product.stock_actual += productoDev.cantidad;
                await product.save();
            } else {
                this.logger.warn(`Producto "${productoDev.nombre}" no encontrado en inventario, no se actualiza stock`);
            }
        }

        // Actualizar estado de la devolución
        devolucion.estado = EstadoDevolucion.PROCESADA;
        devolucion.fechaProcesamiento = new Date();
        devolucion.procesadoPor = usuarioId as any;

        return devolucion.save();
    }

    async cancelar(id: string): Promise<DevolucionDocument> {
        const devolucion = await this.devolucionModel.findById(id).exec();
        
        if (!devolucion) {
            throw new NotFoundException(`Devolución con ID ${id} no encontrada`);
        }

        if (devolucion.estado === EstadoDevolucion.PROCESADA) {
            throw new BadRequestException('No se puede cancelar una devolución procesada');
        }

        devolucion.estado = EstadoDevolucion.CANCELADA;
        return devolucion.save();
    }

    async remove(id: string): Promise<void> {
        const result = await this.devolucionModel.findByIdAndDelete(id).exec();
        
        if (!result) {
            throw new NotFoundException(`Devolución con ID ${id} no encontrada`);
        }
    }
}

