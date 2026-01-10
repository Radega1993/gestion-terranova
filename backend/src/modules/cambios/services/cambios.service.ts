import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cambio, CambioDocument } from '../schemas/cambio.schema';
import { CreateCambioDto } from '../dto/create-cambio.dto';
import { FiltrosCambiosDto } from '../dto/filtros-cambios.dto';
import { ProcesarPagoCambioDto } from '../dto/procesar-pago-cambio.dto';
import { Venta } from '../../ventas/schemas/venta.schema';
import { Product } from '../../inventory/schemas/product.schema';
import { UsersService } from '../../users/users.service';

@Injectable()
export class CambiosService {
    private readonly logger = new Logger(CambiosService.name);

    constructor(
        @InjectModel(Cambio.name) private cambioModel: Model<CambioDocument>,
        @InjectModel(Venta.name) private ventaModel: Model<Venta>,
        @InjectModel(Product.name) private productModel: Model<Product>,
        private usersService: UsersService
    ) { }

    async create(createCambioDto: CreateCambioDto, userId: string, userRole: string): Promise<CambioDocument> {
        // Validar que la venta existe
        const venta = await this.ventaModel.findById(createCambioDto.ventaId).exec();
        if (!venta) {
            throw new NotFoundException(`Venta con ID ${createCambioDto.ventaId} no encontrada`);
        }

        // Validar que la venta es del día actual
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const ventaDoc = venta as any;
        const fechaVenta = new Date(ventaDoc.createdAt || new Date());
        fechaVenta.setHours(0, 0, 0, 0);

        if (fechaVenta.getTime() !== hoy.getTime()) {
            throw new BadRequestException('Solo se pueden cambiar productos de ventas realizadas el día actual');
        }

        // Validar que el producto original existe en la venta
        const productoOriginalEnVenta = venta.productos.find(
            p => p.nombre === createCambioDto.productoOriginal.nombre
        );

        if (!productoOriginalEnVenta) {
            throw new BadRequestException(
                `El producto "${createCambioDto.productoOriginal.nombre}" no existe en la venta`
            );
        }

        // Validar cantidad del producto original
        if (createCambioDto.productoOriginal.cantidad > productoOriginalEnVenta.unidades) {
            throw new BadRequestException(
                `La cantidad a cambiar (${createCambioDto.productoOriginal.cantidad}) excede la cantidad vendida (${productoOriginalEnVenta.unidades})`
            );
        }

        // Validar que el producto nuevo existe en inventario
        const productoNuevoEnInventario = await this.productModel.findOne({
            nombre: createCambioDto.productoNuevo.nombre
        }).exec();

        if (!productoNuevoEnInventario) {
            throw new NotFoundException(
                `Producto "${createCambioDto.productoNuevo.nombre}" no encontrado en inventario`
            );
        }

        // Validar stock del producto nuevo
        if (productoNuevoEnInventario.stock_actual < createCambioDto.productoNuevo.cantidad) {
            throw new BadRequestException(
                `Stock insuficiente para ${createCambioDto.productoNuevo.nombre}. Stock actual: ${productoNuevoEnInventario.stock_actual}`
            );
        }

        // Calcular diferencia de precio
        const diferenciaPrecio = Number(
            (createCambioDto.productoNuevo.total - createCambioDto.productoOriginal.total).toFixed(2)
        );

        // Validar que los totales coinciden
        const totalOriginalCalculado = Number(
            (createCambioDto.productoOriginal.precioUnitario * createCambioDto.productoOriginal.cantidad).toFixed(2)
        );
        const totalNuevoCalculado = Number(
            (createCambioDto.productoNuevo.precioUnitario * createCambioDto.productoNuevo.cantidad).toFixed(2)
        );

        if (Math.abs(totalOriginalCalculado - createCambioDto.productoOriginal.total) > 0.01) {
            throw new BadRequestException('El total del producto original no coincide');
        }

        if (Math.abs(totalNuevoCalculado - createCambioDto.productoNuevo.total) > 0.01) {
            throw new BadRequestException('El total del producto nuevo no coincide');
        }

        // Actualizar inventario
        // 1. Devolver producto original al stock
        const productoOriginalEnInventario = await this.productModel.findOne({
            nombre: createCambioDto.productoOriginal.nombre
        }).exec();

        if (productoOriginalEnInventario) {
            productoOriginalEnInventario.stock_actual += createCambioDto.productoOriginal.cantidad;
            await productoOriginalEnInventario.save();
            this.logger.log(
                `Stock actualizado para ${createCambioDto.productoOriginal.nombre}: +${createCambioDto.productoOriginal.cantidad}`
            );
        }

        // 2. Quitar producto nuevo del stock
        productoNuevoEnInventario.stock_actual -= createCambioDto.productoNuevo.cantidad;
        await productoNuevoEnInventario.save();
        this.logger.log(
            `Stock actualizado para ${createCambioDto.productoNuevo.nombre}: -${createCambioDto.productoNuevo.cantidad}`
        );

        // Actualizar la venta original
        // Crear una copia del array de productos para modificarlo
        let productosFinales = [...venta.productos];
        
        // Encontrar el índice del producto original
        const indiceProductoOriginal = productosFinales.findIndex(
            p => p.nombre === createCambioDto.productoOriginal.nombre
        );

        if (indiceProductoOriginal === -1) {
            throw new BadRequestException('Producto original no encontrado en la venta');
        }

        const productoOriginal = productosFinales[indiceProductoOriginal];

        // Si la cantidad a cambiar es igual a la cantidad vendida, reemplazar completamente
        if (createCambioDto.productoOriginal.cantidad === productoOriginal.unidades) {
            // Reemplazar el producto original por el nuevo
            productosFinales[indiceProductoOriginal] = {
                nombre: createCambioDto.productoNuevo.nombre,
                categoria: productoNuevoEnInventario.tipo,
                unidades: createCambioDto.productoNuevo.cantidad,
                precioUnitario: createCambioDto.productoNuevo.precioUnitario,
                precioTotal: createCambioDto.productoNuevo.total
            };
        } else {
            // Cambio parcial: reducir cantidad del original y agregar el nuevo producto
            // Reducir cantidad del producto original
            const nuevaCantidadOriginal = productoOriginal.unidades - createCambioDto.productoOriginal.cantidad;
            productosFinales[indiceProductoOriginal] = {
                ...productoOriginal,
                unidades: nuevaCantidadOriginal,
                precioTotal: Number((nuevaCantidadOriginal * productoOriginal.precioUnitario).toFixed(2))
            };

            // Agregar el nuevo producto
            productosFinales.push({
                nombre: createCambioDto.productoNuevo.nombre,
                categoria: productoNuevoEnInventario.tipo,
                unidades: createCambioDto.productoNuevo.cantidad,
                precioUnitario: createCambioDto.productoNuevo.precioUnitario,
                precioTotal: createCambioDto.productoNuevo.total
            });
        }

        // Calcular nuevo total de la venta
        const nuevoTotal = Number(
            productosFinales.reduce((sum, p) => sum + p.precioTotal, 0).toFixed(2)
        );

        // Actualizar venta
        venta.productos = productosFinales;
        venta.total = nuevoTotal;

        // Si hay diferencia de precio, NO actualizamos automáticamente el estado de pago
        // El pago/devolución se procesará por separado
        // Solo actualizamos si la diferencia es cero (mismo precio)
        if (diferenciaPrecio === 0) {
            // No hay diferencia, el cambio no afecta el pago
            // El estado de la venta se mantiene igual
        } else if (diferenciaPrecio > 0) {
            // El cliente debe más dinero, pero NO lo cobramos automáticamente
            // Se cobrará cuando se procese el pago del cambio
        } else {
            // El cliente pagó de más, pero NO lo devolvemos automáticamente
            // Se devolverá cuando se procese la devolución del cambio
        }

        await venta.save();

        // Crear el registro de cambio
        const cambioData: any = {
            venta: venta._id,
            usuario: userId,
            productoOriginal: {
                nombre: createCambioDto.productoOriginal.nombre,
                categoria: productoOriginalEnInventario?.tipo,
                cantidad: createCambioDto.productoOriginal.cantidad,
                precioUnitario: createCambioDto.productoOriginal.precioUnitario,
                total: createCambioDto.productoOriginal.total
            },
            productoNuevo: {
                nombre: createCambioDto.productoNuevo.nombre,
                categoria: productoNuevoEnInventario.tipo,
                cantidad: createCambioDto.productoNuevo.cantidad,
                precioUnitario: createCambioDto.productoNuevo.precioUnitario,
                total: createCambioDto.productoNuevo.total
            },
            diferenciaPrecio,
            motivo: createCambioDto.motivo,
            observaciones: createCambioDto.observaciones,
            // Si no hay diferencia de precio, el cambio está completo
            // Si hay diferencia, el estado será PENDIENTE hasta que se procese el pago/devolución
            estadoPago: diferenciaPrecio === 0 ? 'PAGADO' : 'PENDIENTE'
        };

        // Si el usuario es TIENDA y se proporciona trabajadorId, asignarlo
        if (userRole === 'TIENDA' && createCambioDto.trabajadorId) {
            cambioData.trabajador = new Types.ObjectId(createCambioDto.trabajadorId);
        }

        const cambio = new this.cambioModel(cambioData);
        const saved = await cambio.save();

        this.logger.log(
            `Cambio registrado: ${createCambioDto.productoOriginal.nombre} -> ${createCambioDto.productoNuevo.nombre}, diferencia: ${diferenciaPrecio}€`
        );

        return this.cambioModel.findById(saved._id)
            .populate('venta', 'codigoSocio nombreSocio total')
            .populate('usuario', 'username nombre')
            .populate('trabajador', 'nombre apellidos')
            .populate('trabajadorPago', 'nombre apellidos identificador')
            .populate('usuarioPago', 'username nombre')
            .exec();
    }

    async findAll(filtros?: FiltrosCambiosDto): Promise<CambioDocument[]> {
        const query: any = {};

        if (filtros?.fechaInicio || filtros?.fechaFin) {
            query.createdAt = {};
            if (filtros.fechaInicio) {
                query.createdAt.$gte = new Date(filtros.fechaInicio);
            }
            if (filtros.fechaFin) {
                const fechaFin = new Date(filtros.fechaFin);
                fechaFin.setHours(23, 59, 59, 999);
                query.createdAt.$lte = fechaFin;
            }
        }

        if (filtros?.ventaId) {
            query.venta = filtros.ventaId;
        }

        if (filtros?.usuarioId) {
            query.usuario = filtros.usuarioId;
        }

        return this.cambioModel.find(query)
            .populate('venta', 'codigoSocio nombreSocio total')
            .populate('usuario', 'username nombre')
            .populate('trabajador', 'nombre apellidos')
            .populate('trabajadorPago', 'nombre apellidos identificador')
            .populate('usuarioPago', 'username nombre')
            .sort({ createdAt: -1 })
            .exec();
    }

    async findOne(id: string): Promise<CambioDocument> {
        const cambio = await this.cambioModel.findById(id)
            .populate('venta', 'codigoSocio nombreSocio total productos')
            .populate('usuario', 'username nombre')
            .populate('trabajador', 'nombre apellidos')
            .populate('trabajadorPago', 'nombre apellidos identificador')
            .populate('usuarioPago', 'username nombre')
            .exec();

        if (!cambio) {
            throw new NotFoundException(`Cambio con ID ${id} no encontrado`);
        }

        return cambio;
    }

    async getVentasDelDia(): Promise<any[]> {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const mañana = new Date(hoy);
        mañana.setDate(mañana.getDate() + 1);

        const ventas = await this.ventaModel.find({
            createdAt: {
                $gte: hoy,
                $lt: mañana
            }
        })
            .populate('usuario', 'username nombre')
            .populate('trabajador', 'nombre apellidos')
            .sort({ createdAt: -1 })
            .exec();

        // Obtener cambios para cada venta
        const ventasConCambios = await Promise.all(
            ventas.map(async (venta) => {
                const cambios = await this.cambioModel.find({ venta: venta._id })
                    .populate('trabajador', 'nombre apellidos')
                    .populate('usuario', 'username nombre')
                    .sort({ createdAt: 1 })
                    .exec();

                return {
                    ...venta.toObject(),
                    cambios: cambios.map(c => {
                        const cambioDoc = c.toObject ? c.toObject() : c as any;
                        return {
                            _id: cambioDoc._id,
                            productoOriginal: cambioDoc.productoOriginal,
                            productoNuevo: cambioDoc.productoNuevo,
                            diferenciaPrecio: cambioDoc.diferenciaPrecio,
                            estadoPago: cambioDoc.estadoPago,
                            motivo: cambioDoc.motivo,
                            createdAt: cambioDoc.createdAt
                        };
                    })
                };
            })
        );

        return ventasConCambios;
    }

    async procesarPagoCambio(
        id: string,
        procesarPagoDto: ProcesarPagoCambioDto,
        userId: string,
        userRole: string
    ): Promise<CambioDocument> {
        const cambio = await this.cambioModel.findById(id).exec();
        
        if (!cambio) {
            throw new NotFoundException(`Cambio con ID ${id} no encontrado`);
        }

        const cambioDoc = cambio as any;
        
        if (cambioDoc.estadoPago !== 'PENDIENTE') {
            throw new BadRequestException(
                `El cambio ya ha sido procesado. Estado actual: ${cambioDoc.estadoPago}`
            );
        }

        // Obtener la venta asociada
        const venta = await this.ventaModel.findById(cambioDoc.venta).exec();
        if (!venta) {
            throw new NotFoundException('Venta asociada no encontrada');
        }

        const diferenciaPrecio = cambioDoc.diferenciaPrecio;

        // Determinar trabajadorId si el usuario es TIENDA
        let trabajadorId: string | undefined;
        if (userRole === 'TIENDA') {
            if (procesarPagoDto.trabajadorId) {
                trabajadorId = procesarPagoDto.trabajadorId;
            } else {
                throw new BadRequestException('Debe seleccionar un trabajador para procesar el pago');
            }
        }

        // Actualizar el cambio con la información del pago/devolución
        cambioDoc.metodoPago = procesarPagoDto.metodoPago;
        if (procesarPagoDto.observaciones) {
            cambioDoc.observaciones = procesarPagoDto.observaciones;
        }

        if (trabajadorId) {
            cambioDoc.trabajadorPago = new Types.ObjectId(trabajadorId);
        } else {
            cambioDoc.usuarioPago = new Types.ObjectId(userId);
        }

        // Actualizar estado del pago y la venta
        if (diferenciaPrecio > 0) {
            // Hay que cobrar más - el cliente paga la diferencia
            cambioDoc.estadoPago = 'PAGADO';
            
            // Cuando se procesa el pago del cambio, el cliente paga la diferencia
            // El total de la venta ya fue actualizado cuando se creó el cambio (aumentó)
            // El pagado original se mantiene, pero ahora el total es mayor
            // Como estamos procesando el pago de la diferencia, aumentamos el pagado
            venta.pagado = Number((venta.pagado + diferenciaPrecio).toFixed(2));
            
            // Actualizar estado de la venta
            if (venta.pagado >= venta.total) {
                venta.estado = 'PAGADO';
            } else if (venta.pagado > 0) {
                venta.estado = 'PAGADO_PARCIAL';
            } else {
                venta.estado = 'PENDIENTE';
            }
        } else if (diferenciaPrecio < 0) {
            // Hay que devolver - el cliente recibe dinero de vuelta
            cambioDoc.estadoPago = 'DEVUELTO';
            
            // Cuando se procesa la devolución, el cliente recibe dinero
            // El total de la venta ya fue reducido cuando se creó el cambio
            // El pagado original se mantiene, pero ahora el total es menor
            // Como estamos devolviendo dinero, reducimos el pagado
            venta.pagado = Number((venta.pagado + diferenciaPrecio).toFixed(2)); // diferenciaPrecio es negativo
            
            // Actualizar estado de la venta
            if (venta.pagado >= venta.total) {
                venta.estado = 'PAGADO';
            } else if (venta.pagado > 0) {
                venta.estado = 'PAGADO_PARCIAL';
            } else {
                venta.estado = 'PENDIENTE';
            }
        } else {
            // Sin diferencia, ya estaba marcado como PAGADO
            cambioDoc.estadoPago = 'PAGADO';
        }

        await venta.save();
        await cambio.save();

        this.logger.log(
            `Pago/devolución procesado para cambio ${id}. Diferencia: ${diferenciaPrecio}€, Estado: ${cambioDoc.estadoPago}`
        );

        return this.cambioModel.findById(id)
            .populate('venta', 'codigoSocio nombreSocio total')
            .populate('usuario', 'username nombre')
            .populate('trabajador', 'nombre apellidos')
            .populate('trabajadorPago', 'nombre apellidos identificador')
            .populate('usuarioPago', 'username nombre')
            .exec();
    }
}

