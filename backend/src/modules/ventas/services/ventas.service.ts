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
import { Trabajador } from '../../users/schemas/trabajador.schema';
import { UsersService } from '../../users/users.service';

interface PopulatedReserva extends Omit<Reserva, 'socio' | 'usuarioCreacion' | 'usuarioActualizacion' | 'confirmadoPor' | 'trabajador'> {
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
    trabajador?: {
        _id: Types.ObjectId;
        nombre: string;
        identificador: string;
    };
    createdAt?: Date;
}

interface PopulatedVenta extends Omit<Venta, 'usuario' | 'productos' | 'trabajador'> {
    _id: Types.ObjectId;
    usuario: {
        _id: Types.ObjectId;
        username: string;
    };
    trabajador?: {
        _id: Types.ObjectId;
        nombre: string;
        identificador: string;
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
        @InjectModel(Socio.name) private socioModel: Model<Socio>,
        @InjectModel(Trabajador.name) private trabajadorModel: Model<Trabajador>,
        private usersService: UsersService
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
        const query: any = { ...dateFilter };
        
        // Filtro por trabajador
        if (filters.trabajadorId) {
            query.trabajador = filters.trabajadorId;
        }
        
        return this.ventaModel.find(query)
            .populate('trabajador', 'nombre identificador')
            .populate('usuario', 'username nombre')
            .sort({ createdAt: -1 })
            .exec();
    }

    async findByCliente(codigoCliente: string, filters: VentaFiltersDto): Promise<Venta[]> {
        const dateFilter = this.buildDateFilter(filters);
        const query: any = {
            codigoSocio: codigoCliente,
            ...dateFilter
        };
        
        // Filtro por trabajador
        if (filters.trabajadorId) {
            query.trabajador = filters.trabajadorId;
        }
        
        return this.ventaModel.find(query)
            .populate('trabajador', 'nombre identificador')
            .populate('usuario', 'username nombre')
            .sort({ createdAt: -1 })
            .exec();
    }

    async findByUsuario(userId: string, filters: VentaFiltersDto): Promise<Venta[]> {
        const dateFilter = this.buildDateFilter(filters);
        const query: any = {
            usuario: userId,
            ...dateFilter
        };
        
        // Filtro por trabajador
        if (filters.trabajadorId) {
            query.trabajador = filters.trabajadorId;
        }
        
        return this.ventaModel.find(query)
            .populate('trabajador', 'nombre identificador')
            .populate('usuario', 'username nombre')
            .sort({ createdAt: -1 })
            .exec();
    }

    async findPendientes(filters: VentaFiltersDto): Promise<Venta[]> {
        const dateFilter = this.buildDateFilter(filters);
        const query: any = {
            estado: { $in: ['PENDIENTE', 'PAGADO_PARCIAL'] },
            ...dateFilter
        };
        
        // Filtro por código de cliente/socio
        if (filters.codigoCliente) {
            query.codigoSocio = filters.codigoCliente;
        }
        
        // Filtro por trabajador
        if (filters.trabajadorId) {
            query.trabajador = filters.trabajadorId;
        }
        
        // Filtro por estado específico si se proporciona
        // Si no se proporciona estado o es 'PENDIENTE', buscar ambas (PENDIENTE y PAGADO_PARCIAL)
        // Solo aplicar filtro específico si es 'PAGADO_PARCIAL'
        if (filters.estado && filters.estado !== 'PENDIENTE') {
            query.estado = filters.estado;
        }
        
        this.logger.debug(`Buscando ventas pendientes con query: ${JSON.stringify(query, null, 2)}`);
        
        const ventas = await this.ventaModel.find(query)
            .populate('trabajador', 'nombre identificador')
            .populate('usuario', 'username nombre')
            .sort({ createdAt: -1 })
            .exec();
        
        this.logger.debug(`Encontradas ${ventas.length} ventas pendientes`);
        if (ventas.length > 0) {
            const primeraVenta = ventas[0] as any;
            this.logger.debug(`Primera venta: ${JSON.stringify({
                _id: primeraVenta._id,
                codigoSocio: primeraVenta.codigoSocio,
                nombreSocio: primeraVenta.nombreSocio,
                total: primeraVenta.total,
                pagado: primeraVenta.pagado,
                estado: primeraVenta.estado,
                createdAt: primeraVenta.createdAt
            }, null, 2)}`);
        }
        
        return ventas;
    }

    async create(createVentaDto: CreateVentaDto, userId: string, userRole: string): Promise<Venta> {
        try {
            // Redondear precio y pagado a 2 decimales primero
            const precioRedondeado = Number(createVentaDto.total.toFixed(2));
            let pagadoRedondeado = Number(createVentaDto.pagado.toFixed(2));

            // Validar que haya observaciones si el pago es parcial
            if (pagadoRedondeado < precioRedondeado && !createVentaDto.observaciones) {
                throw new BadRequestException('Las observaciones son obligatorias cuando el pago es parcial');
            }

            // Ajustar el monto pagado si excede el total
            if (pagadoRedondeado > precioRedondeado) {
                pagadoRedondeado = precioRedondeado;
            }

            // Calcular el estado basado en el pago (usando comparación con tolerancia)
            let estado = 'PENDIENTE';
            if (Math.abs(pagadoRedondeado - precioRedondeado) < 0.01) {
                estado = 'PAGADO';
            } else if (pagadoRedondeado > 0) {
                estado = 'PAGADO_PARCIAL';
            }

            // NUEVO: Si el usuario es TIENDA, trabajadorId es OBLIGATORIO
            let trabajadorId = null;
            if (userRole === 'TIENDA') {
                if (!createVentaDto.trabajadorId) {
                    throw new BadRequestException('Debe seleccionar un trabajador para realizar la venta');
                }
                
                // Obtener la tienda del usuario
                const user = await this.usersService.findOne(userId);
                if (!user.tienda) {
                    throw new BadRequestException('No tiene una tienda asignada');
                }
                
                // Validar que el trabajador pertenece a la tienda del usuario y está activo
                const trabajador = await this.trabajadorModel.findOne({
                    _id: createVentaDto.trabajadorId,
                    tienda: user.tienda,
                    activo: true
                }).exec();
                
                if (!trabajador) {
                    throw new BadRequestException('Trabajador no válido o no pertenece a esta tienda');
                }
                
                trabajadorId = createVentaDto.trabajadorId;
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

            const ventaData: any = {
                ...createVentaDto,
                productos: productosConCategoria,
                usuario: userId,
                estado,
                total: precioRedondeado,
                pagado: pagadoRedondeado,
                pagos: []
            };

            // Si hay un pago inicial, crear el registro de pago
            if (pagadoRedondeado > 0) {
                ventaData.pagos = [{
                    fecha: new Date(),
                    monto: pagadoRedondeado,
                    metodoPago: createVentaDto.metodoPago || 'EFECTIVO',
                    observaciones: createVentaDto.observaciones || ''
                }];
            }

            // Añadir trabajador si existe
            if (trabajadorId) {
                ventaData.trabajador = trabajadorId;
            }

            const venta = new this.ventaModel(ventaData);

            const savedVenta = await venta.save();
            this.logger.log(`Venta creada con ID: ${savedVenta._id}`);
            return savedVenta;
        } catch (error) {
            this.logger.error(`Error al crear venta: ${error.message}`, error.stack);
            throw error;
        }
    }

    async registrarPago(id: string, pagoVentaDto: PagoVentaDto, userId: string, userRole: string) {
        this.logger.debug(`Iniciando registro de pago para venta ${id}`);
        this.logger.debug('Datos del pago recibidos:', pagoVentaDto);
        this.logger.debug(`Usuario: ${userId}, Rol: ${userRole}`);

        // Validar trabajador si el usuario es TIENDA
        let trabajadorId = null;
        if (userRole === 'TIENDA') {
            if (!pagoVentaDto.trabajadorId) {
                throw new BadRequestException('Debe seleccionar un trabajador para realizar el pago');
            }
            
            // Obtener la tienda del usuario
            const user = await this.usersService.findOne(userId);
            if (!user.tienda) {
                throw new BadRequestException('No tiene una tienda asignada');
            }
            
            // Validar que el trabajador pertenece a la tienda del usuario y está activo
            const trabajador = await this.trabajadorModel.findOne({
                _id: pagoVentaDto.trabajadorId,
                tienda: user.tienda,
                activo: true
            }).exec();
            
            if (!trabajador) {
                throw new BadRequestException('Trabajador no válido o no pertenece a esta tienda');
            }
            
            trabajadorId = pagoVentaDto.trabajadorId;
        }

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

        // Si el pago excede el pendiente, ajustar al pendiente (el cambio se maneja en el frontend)
        // Solo permitir esto para pagos en efectivo
        let montoPagoAjustado = montoPago;
        if (montoPago > pendiente) {
            if (pagoVentaDto.metodoPago !== 'EFECTIVO') {
                this.logger.error(`El pago (${montoPago}) excede el monto pendiente (${pendiente}) y no es efectivo`);
                throw new BadRequestException('El pago excede el monto pendiente. Solo se permite cambio en pagos en efectivo.');
            }
            // Ajustar el monto al pendiente (el cambio se maneja en el frontend)
            montoPagoAjustado = pendiente;
            this.logger.debug(`Pago ajustado de ${montoPago} a ${montoPagoAjustado} (cambio: ${Number((montoPago - pendiente).toFixed(2))})`);
        }

        const nuevoPagado = Number((pagado + montoPagoAjustado).toFixed(2));
        // Usar comparación con tolerancia para evitar problemas de precisión de punto flotante
        const nuevoEstado = Math.abs(nuevoPagado - total) < 0.01 ? 'PAGADO' : 'PAGADO_PARCIAL';

        this.logger.debug('Nuevos valores:', {
            nuevoPagado,
            nuevoEstado
        });

        // Registrar el pago en el historial (redondeado a 2 decimales)
        const pago = {
            fecha: new Date(),
            monto: montoPagoAjustado,
            metodoPago: pagoVentaDto.metodoPago,
            observaciones: pagoVentaDto.observaciones || ''
        };

        venta.pagos = venta.pagos || [];
        venta.pagos.push(pago);

        // Actualizar la venta
        venta.pagado = nuevoPagado;
        venta.estado = nuevoEstado;
        
        // Si se proporciona trabajadorId y la venta no tiene trabajador asignado, asignarlo
        // O si el usuario es TIENDA y se proporciona trabajadorId, actualizarlo
        if (trabajadorId) {
            venta.trabajador = trabajadorId as any;
        }

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

        // Construir filtros de usuario y trabajador
        const condicionesUsuarioTrabajador: any[] = [];
        
        if (filtros.usuario) {
            const usuarioIds = Array.isArray(filtros.usuario) ? filtros.usuario : [filtros.usuario];
            const usuarioObjectIds = usuarioIds.map(id => new Types.ObjectId(id));
            if (usuarioObjectIds.length === 1) {
                condicionesUsuarioTrabajador.push({ usuario: usuarioObjectIds[0] });
            } else if (usuarioObjectIds.length > 1) {
                condicionesUsuarioTrabajador.push({ usuario: { $in: usuarioObjectIds } });
            }
        }
        
        if (filtros.trabajadorId) {
            const trabajadorIds = Array.isArray(filtros.trabajadorId) ? filtros.trabajadorId : [filtros.trabajadorId];
            const trabajadorObjectIds = trabajadorIds.map(id => new Types.ObjectId(id));
            if (trabajadorObjectIds.length === 1) {
                condicionesUsuarioTrabajador.push({ trabajador: trabajadorObjectIds[0] });
            } else if (trabajadorObjectIds.length > 1) {
                condicionesUsuarioTrabajador.push({ trabajador: { $in: trabajadorObjectIds } });
            }
        }

        // Si hay condiciones de usuario o trabajador, usar $or para buscar cualquiera de ellos
        if (condicionesUsuarioTrabajador.length > 0) {
            if (condicionesUsuarioTrabajador.length === 1) {
                // Solo una condición, aplicarla directamente
                Object.assign(filtroVentas, condicionesUsuarioTrabajador[0]);
            } else {
                // Múltiples condiciones, usar $or
                filtroVentas.$or = condicionesUsuarioTrabajador;
            }
        }

        // Construir el filtro base para reservas
        // Incluir todas las reservas que tengan pagos (montoAbonado > 0 o pagos array con elementos), no solo las completadas
        const filtroReservas: any = {
            $or: [
                { montoAbonado: { $gt: 0 } },
                { 'pagos.0': { $exists: true } } // Si tiene al menos un pago
            ]
        };
        
        // Si hay filtro de fecha, añadir condiciones adicionales usando $and
        if (filtros.fechaInicio && filtros.fechaFin) {
            const fechaInicio = new Date(filtros.fechaInicio);
            const fechaFin = new Date(filtros.fechaFin);
            // Ajustar fechaFin para incluir todo el día
            fechaFin.setHours(23, 59, 59, 999);
            
            filtroReservas.$and = [
                {
                    $or: [
                        { createdAt: { $gte: fechaInicio, $lte: fechaFin } },
                        { fecha: { $gte: fechaInicio, $lte: fechaFin } },
                        { 'pagos.fecha': { $gte: fechaInicio, $lte: fechaFin } }
                    ]
                }
            ];
        }
        
        if (filtros.usuario) {
            const usuarioIds = Array.isArray(filtros.usuario) ? filtros.usuario : [filtros.usuario];
            if (usuarioIds.length === 1) {
                filtroReservas.usuarioCreacion = new Types.ObjectId(usuarioIds[0]);
            } else if (usuarioIds.length > 1) {
                filtroReservas.usuarioCreacion = { $in: usuarioIds.map(id => new Types.ObjectId(id)) };
            }
        }
        
        // Si hay filtro de trabajador, aplicarlo también
        if (filtros.trabajadorId) {
            const trabajadorIds = Array.isArray(filtros.trabajadorId) ? filtros.trabajadorId : [filtros.trabajadorId];
            const trabajadorObjectIds = trabajadorIds.map(id => new Types.ObjectId(id));
            if (trabajadorObjectIds.length === 1) {
                filtroReservas.trabajador = trabajadorObjectIds[0];
            } else if (trabajadorObjectIds.length > 1) {
                filtroReservas.trabajador = { $in: trabajadorObjectIds };
            }
        }

        console.log('Filtro ventas:', JSON.stringify(filtroVentas, null, 2));
        console.log('Filtro reservas:', JSON.stringify(filtroReservas, null, 2));

        // Obtener ventas
        const ventas = await this.ventaModel
            .find(filtroVentas)
            .populate('usuario', 'username')
            .populate('trabajador', 'nombre identificador')
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
                    .populate('trabajador', 'nombre identificador')
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
                .populate('trabajador', 'nombre identificador')
                .lean()
                .exec() as unknown as PopulatedReserva[];
        }

        console.log('Reservas encontradas:', reservas.length);
        if (reservas.length > 0) {
            console.log('Primera reserva:', JSON.stringify(reservas[0], null, 2));
        }

        // Transformar reservas al formato común
        // Similar a las ventas, si hay pagos individuales, crear una fila por cada pago
        const reservasTransformadas = reservas.flatMap(reserva => {
            console.log('Transformando reserva:', JSON.stringify(reserva, null, 2));
            const nombreCompleto = reserva.socio?.nombre ?
                `${reserva.socio.nombre.nombre} ${reserva.socio.nombre.primerApellido}${reserva.socio.nombre.segundoApellido ? ' ' + reserva.socio.nombre.segundoApellido : ''}` :
                'Socio no encontrado';

            // Si la reserva tiene pagos individuales, crear una fila por cada pago
            if (reserva.pagos && reserva.pagos.length > 0) {
                return reserva.pagos.map(pago => ({
                    _id: reserva._id,
                    tipo: 'RESERVA',
                    fecha: pago.fecha || reserva.createdAt || reserva.fecha, // Usar fecha del pago, o creación, o fecha reserva
                    socio: {
                        codigo: reserva.socio?.socio || '',
                        nombre: nombreCompleto
                    },
                    usuario: {
                        _id: reserva.usuarioCreacion._id,
                        username: reserva.usuarioCreacion.username
                    },
                    trabajador: reserva.trabajador ? {
                        _id: reserva.trabajador._id,
                        nombre: reserva.trabajador.nombre,
                        identificador: reserva.trabajador.identificador
                    } : undefined,
                    total: reserva.precio,
                    pagado: pago.monto,
                    fianza: reserva.fianza || 0,
                    metodoPago: pago.metodoPago,
                    estado: reserva.estado,
                    detalles: [{
                        nombre: reserva.tipoInstalacion,
                        cantidad: 1,
                        precio: reserva.precio,
                        total: reserva.precio
                    }],
                    pagos: [{
                        fecha: pago.fecha || (reserva.createdAt as Date) || reserva.fecha,
                        monto: pago.monto,
                        metodoPago: pago.metodoPago,
                        observaciones: undefined
                    }]
                }));
            }

            // Si no hay pagos individuales pero hay montoAbonado, crear una fila con ese monto
            if (reserva.montoAbonado && reserva.montoAbonado > 0) {
                return [{
                    _id: reserva._id,
                    tipo: 'RESERVA',
                    fecha: (reserva.createdAt as Date) || reserva.fecha, // Usar fecha de creación o fecha de reserva
                    socio: {
                        codigo: reserva.socio?.socio || '',
                        nombre: nombreCompleto
                    },
                    usuario: {
                        _id: reserva.usuarioCreacion._id,
                        username: reserva.usuarioCreacion.username
                    },
                    trabajador: reserva.trabajador ? {
                        _id: reserva.trabajador._id,
                        nombre: reserva.trabajador.nombre,
                        identificador: reserva.trabajador.identificador
                    } : undefined,
                    total: reserva.precio,
                    pagado: reserva.montoAbonado,
                    fianza: reserva.fianza || 0,
                    metodoPago: reserva.metodoPago,
                    estado: reserva.estado,
                    detalles: [{
                        nombre: reserva.tipoInstalacion,
                        cantidad: 1,
                        precio: reserva.precio,
                        total: reserva.precio
                    }],
                    pagos: [{
                        fecha: (reserva.createdAt as Date) || reserva.fecha,
                        monto: reserva.montoAbonado,
                        metodoPago: reserva.metodoPago || '',
                        observaciones: undefined
                    }]
                }];
            }

            // Si no hay pagos ni montoAbonado, no incluir esta reserva
            return [];
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
                    trabajador: venta.trabajador ? {
                        _id: venta.trabajador._id,
                        nombre: venta.trabajador.nombre,
                        identificador: venta.trabajador.identificador
                    } : undefined,
                    total: Number(venta.total.toFixed(2)),
                    pagado: Number(venta.pagado.toFixed(2)),
                    metodoPago: venta.metodoPago, // Método de pago de la venta
                    estado: venta.estado,
                    detalles: venta.productos.map(p => ({
                        nombre: p.nombre,
                        cantidad: p.unidades,
                        precio: Number(p.precioUnitario.toFixed(2)),
                        total: Number(p.precioTotal.toFixed(2))
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
                trabajador: venta.trabajador ? {
                    _id: venta.trabajador._id,
                    nombre: venta.trabajador.nombre,
                    identificador: venta.trabajador.identificador
                } : undefined,
                total: Number(venta.total.toFixed(2)),
                pagado: Number(pago.monto.toFixed(2)), // Usar el monto del pago específico
                metodoPago: pago.metodoPago, // Método de pago del pago específico
                estado: venta.estado,
                detalles: venta.productos.map(p => ({
                    nombre: p.nombre,
                    cantidad: p.unidades,
                    precio: Number(p.precioUnitario.toFixed(2)),
                    total: Number(p.precioTotal.toFixed(2))
                })),
                pagos: [{
                    fecha: pago.fecha,
                    monto: Number(pago.monto.toFixed(2)),
                    metodoPago: pago.metodoPago,
                    observaciones: pago.observaciones
                }]
            }));
        });

        // Combinar reservas y ventas
        let recaudaciones = [...reservasTransformadas, ...ventasTransformadas];

        // Aplicar filtro de método de pago si está presente
        if (filtros.metodoPago && filtros.metodoPago !== 'todos') {
            const metodoPagoFiltro = filtros.metodoPago.toLowerCase();
            recaudaciones = recaudaciones.filter(recaudacion => {
                // Función auxiliar para normalizar el método de pago
                const normalizarMetodoPago = (metodo: string | undefined): string => {
                    if (!metodo) return '';
                    const metodoLower = metodo.toLowerCase();
                    // Normalizar variaciones comunes
                    if (metodoLower === 'efectivo' || metodoLower === 'EFECTIVO' || metodoLower === 'cash') {
                        return 'efectivo';
                    }
                    if (metodoLower === 'tarjeta' || metodoLower === 'TARJETA' || metodoLower === 'card' || metodoLower === 'CARD') {
                        return 'tarjeta';
                    }
                    return metodoLower;
                };

                // Si tiene pagos individuales, verificar el método de pago de cada pago
                if (recaudacion.pagos && recaudacion.pagos.length > 0) {
                    return recaudacion.pagos.some(pago => {
                        const metodoPagoPago = normalizarMetodoPago(pago.metodoPago);
                        return metodoPagoPago === metodoPagoFiltro;
                    });
                }
                // Si no tiene pagos individuales, verificar el método de pago de la recaudación
                const metodoPagoRecaudacion = normalizarMetodoPago((recaudacion as any).metodoPago);
                return metodoPagoRecaudacion === metodoPagoFiltro;
            });
        }

        // Ordenar por fecha
        recaudaciones.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

        return recaudaciones;
    }
} 