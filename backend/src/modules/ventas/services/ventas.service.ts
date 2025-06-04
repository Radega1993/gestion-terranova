import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Document, Types, Schema } from 'mongoose';
import { Venta } from '../schemas/venta.schema';
import { CreateVentaDto } from '../dto/create-venta.dto';
import { PagoVentaDto } from '../dto/pago-venta.dto';
import { Product } from '../../inventory/schemas/product.schema';
import { VentaFiltersDto } from '../dto/venta-filters.dto';
import { Reserva } from '../../reservas/schemas/reserva.schema';
import { User } from '../../users/schemas/user.schema';
import { Socio } from '../../socios/schemas/socio.schema';
import { Servicio } from '../../reservas/schemas/servicio.schema';
import { RecaudacionesFiltrosDto } from '../dto/recaudaciones-filtros.dto';

interface PopulatedReserva extends Omit<Reserva, 'socio' | 'usuarioCreacion' | 'usuarioActualizacion' | 'confirmadoPor'> {
    _id: Types.ObjectId;
    socio: {
        _id: Types.ObjectId;
        socio: string;
        nombre: {
            nombre: string;
            primerApellido: string;
            segundoApellido?: string;
        };
    };
    usuarioCreacion: {
        _id: Types.ObjectId;
        username: string;
    };
}

interface PopulatedVenta extends Omit<Venta, 'usuario' | 'productos'> {
    _id: Types.ObjectId;
    usuario: {
        _id: Types.ObjectId;
        username: string;
    };
    createdAt: Date;
    productos: Array<{
        nombre: string;
        categoria: string;
        unidades: number;
        precioUnitario: number;
        precioTotal: number;
        _id: Types.ObjectId;
    }>;
}

@Injectable()
export class VentasService {
    private readonly logger = new Logger(VentasService.name);

    constructor(
        @InjectModel(Venta.name) private ventaModel: Model<Venta>,
        @InjectModel(Product.name) private productModel: Model<Product>,
        @InjectModel(Reserva.name) private reservaModel: Model<Reserva>,
        @InjectModel(Socio.name) private socioModel: Model<Socio>
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
                        nombre: producto.nombre,
                        categoria: productoEncontrado.tipo,
                        unidades: producto.unidades,
                        precioUnitario: producto.precioUnitario,
                        precioTotal: producto.precioTotal
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
        this.logger.debug(`Iniciando registro de pago para venta ${id}`);
        this.logger.debug('Datos del pago recibidos:', pagoVentaDto);

        const venta = await this.ventaModel.findById(id);
        if (!venta) {
            this.logger.error(`Venta ${id} no encontrada`);
            throw new NotFoundException(`Venta ${id} no encontrada`);
        }

        // Redondear todos los valores a 2 decimales
        const total = Number(venta.total.toFixed(2));
        const pagado = Number(venta.pagado.toFixed(2));
        const montoPago = Number(pagoVentaDto.pagado.toFixed(2));

        this.logger.debug('Datos de la venta (redondeados):', {
            total,
            pagado,
            estado: venta.estado
        });

        const pendiente = Number((total - pagado).toFixed(2));
        this.logger.debug(`Monto pendiente: ${pendiente}, Pago a registrar: ${montoPago}`);

        if (montoPago > pendiente) {
            this.logger.error(`El pago (${montoPago}) excede el monto pendiente (${pendiente})`);
            throw new BadRequestException('El pago excede el monto pendiente');
        }

        const nuevoPagado = Number((pagado + montoPago).toFixed(2));
        const nuevoEstado = nuevoPagado === total ? 'PAGADO' : 'PAGADO_PARCIAL';

        this.logger.debug('Nuevos valores:', {
            nuevoPagado,
            nuevoEstado
        });

        // Registrar el pago en el historial
        const pago = {
            fecha: new Date(),
            monto: montoPago,
            metodoPago: pagoVentaDto.metodoPago,
            observaciones: pagoVentaDto.observaciones
        };

        venta.pagos = venta.pagos || [];
        venta.pagos.push(pago);

        // Actualizar la venta
        venta.pagado = nuevoPagado;
        venta.estado = nuevoEstado;

        const ventaActualizada = await venta.save();
        this.logger.debug('Venta actualizada:', ventaActualizada);

        return ventaActualizada;
    }

    async getRecaudaciones(filtros: RecaudacionesFiltrosDto) {
        console.log('Filtros recibidos:', filtros);

        // Construir el filtro base para ventas
        const filtroVentas: any = {};
        if (filtros.fechaInicio && filtros.fechaFin) {
            filtroVentas.createdAt = {
                $gte: new Date(filtros.fechaInicio),
                $lte: new Date(filtros.fechaFin)
            };
        }
        if (filtros.codigoSocio) {
            filtroVentas.codigoSocio = filtros.codigoSocio;
        }
        if (filtros.usuario) {
            filtroVentas.usuario = new Types.ObjectId(filtros.usuario);
        }

        // Construir el filtro base para reservas
        const filtroReservas: any = {
            estado: 'COMPLETADA'
        };
        if (filtros.fechaInicio && filtros.fechaFin) {
            filtroReservas.fecha = {
                $gte: new Date(filtros.fechaInicio),
                $lte: new Date(filtros.fechaFin)
            };
        }
        if (filtros.usuario) {
            filtroReservas.usuarioCreacion = new Types.ObjectId(filtros.usuario);
        }

        console.log('Filtro ventas:', JSON.stringify(filtroVentas, null, 2));
        console.log('Filtro reservas:', JSON.stringify(filtroReservas, null, 2));

        // Obtener ventas
        const ventas = await this.ventaModel
            .find(filtroVentas)
            .populate('usuario', 'username')
            .lean()
            .exec() as unknown as PopulatedVenta[];

        console.log('Ventas encontradas:', ventas.length);
        if (ventas.length > 0) {
            console.log('Primera venta:', JSON.stringify(ventas[0], null, 2));
        }

        // Obtener reservas
        let reservas: PopulatedReserva[] = [];
        if (filtros.codigoSocio) {
            // Primero encontrar el socio por su código
            const socio = await this.socioModel.findOne({ socio: filtros.codigoSocio });
            if (socio) {
                // Luego buscar las reservas por el ID del socio
                reservas = await this.reservaModel
                    .find({
                        ...filtroReservas,
                        socio: socio._id
                    })
                    .populate({
                        path: 'socio',
                        model: 'Socio',
                        select: 'socio nombre'
                    })
                    .populate('usuarioCreacion', 'username')
                    .lean()
                    .exec() as unknown as PopulatedReserva[];
            }
        } else {
            reservas = await this.reservaModel
                .find(filtroReservas)
                .populate({
                    path: 'socio',
                    model: 'Socio',
                    select: 'socio nombre'
                })
                .populate('usuarioCreacion', 'username')
                .lean()
                .exec() as unknown as PopulatedReserva[];
        }

        console.log('Reservas encontradas:', reservas.length);
        if (reservas.length > 0) {
            console.log('Primera reserva:', JSON.stringify(reservas[0], null, 2));
        }

        // Transformar reservas al formato común
        const reservasTransformadas = reservas.map(reserva => {
            console.log('Transformando reserva:', JSON.stringify(reserva, null, 2));
            const nombreCompleto = reserva.socio?.nombre ?
                `${reserva.socio.nombre.nombre} ${reserva.socio.nombre.primerApellido}${reserva.socio.nombre.segundoApellido ? ' ' + reserva.socio.nombre.segundoApellido : ''}` :
                'Socio no encontrado';

            return {
                _id: reserva._id,
                tipo: 'RESERVA',
                fecha: reserva.fecha,
                socio: {
                    codigo: reserva.socio?.socio || '',
                    nombre: nombreCompleto
                },
                usuario: {
                    _id: reserva.usuarioCreacion._id,
                    username: reserva.usuarioCreacion.username
                },
                total: reserva.precio,
                pagado: reserva.montoAbonado,
                estado: reserva.estado,
                detalles: [{
                    nombre: reserva.tipoInstalacion,
                    cantidad: 1,
                    precio: reserva.precio,
                    total: reserva.precio
                }]
            };
        });

        // Transformar ventas al formato común
        const ventasTransformadas = ventas.flatMap(venta => {
            // Si no hay pagos, devolver la venta como está
            if (!venta.pagos || venta.pagos.length === 0) {
                return [{
                    _id: venta._id,
                    tipo: 'VENTA',
                    fecha: venta.createdAt,
                    socio: {
                        codigo: venta.codigoSocio,
                        nombre: venta.nombreSocio
                    },
                    usuario: {
                        _id: venta.usuario._id,
                        username: venta.usuario.username
                    },
                    total: venta.total,
                    pagado: venta.pagado,
                    estado: venta.estado,
                    detalles: venta.productos.map(p => ({
                        nombre: p.nombre,
                        cantidad: p.unidades,
                        precio: p.precioUnitario,
                        total: p.precioTotal
                    })),
                    pagos: []
                }];
            }

            // Transformar cada pago en una fila independiente
            return venta.pagos.map(pago => ({
                _id: venta._id,
                tipo: 'VENTA',
                fecha: pago.fecha, // Usar la fecha del pago en lugar de la fecha de la venta
                socio: {
                    codigo: venta.codigoSocio,
                    nombre: venta.nombreSocio
                },
                usuario: {
                    _id: venta.usuario._id,
                    username: venta.usuario.username
                },
                total: venta.total,
                pagado: pago.monto, // Usar el monto del pago específico
                estado: venta.estado,
                detalles: venta.productos.map(p => ({
                    nombre: p.nombre,
                    cantidad: p.unidades,
                    precio: p.precioUnitario,
                    total: p.precioTotal
                })),
                pagos: [{
                    fecha: pago.fecha,
                    monto: pago.monto,
                    metodoPago: pago.metodoPago,
                    observaciones: pago.observaciones
                }]
            }));
        });

        // Combinar y ordenar por fecha
        const recaudaciones = [...reservasTransformadas, ...ventasTransformadas]
            .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

        return recaudaciones;
    }
} 