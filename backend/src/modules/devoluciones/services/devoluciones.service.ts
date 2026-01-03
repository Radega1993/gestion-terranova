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
        // Validar que la venta existe
        const venta = await this.ventaModel.findById(createDevolucionDto.venta).exec();
        if (!venta) {
            throw new NotFoundException(`Venta con ID ${createDevolucionDto.venta} no encontrada`);
        }

        // Validar que el usuario tiene permiso para devolver esta venta
        if (userRole !== 'ADMINISTRADOR' && userRole !== 'JUNTA') {
            if (venta.usuario.toString() !== userId) {
                // Si es TIENDA, verificar que el trabajador pertenece a su tienda
                if (userRole === 'TIENDA') {
                    const user = await this.usersService.findOne(userId);
                    if (!user.tienda) {
                        throw new BadRequestException('No tiene una tienda asignada');
                    }
                    if (createDevolucionDto.trabajador) {
                        // Validar que el trabajador pertenece a la tienda
                        // Esta validación se puede hacer en el controller
                    }
                } else {
                    throw new BadRequestException('No tiene permiso para devolver esta venta');
                }
            }
        }

        // Validar productos a devolver
        const productosVenta = venta.productos;
        const productosDevolucion = createDevolucionDto.productos;

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
                this.logger.log(`Stock actualizado para ${productoDev.nombre}: +${productoDev.cantidad}`);
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

