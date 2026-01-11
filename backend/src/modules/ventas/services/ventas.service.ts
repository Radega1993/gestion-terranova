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
import { CambiosService } from '../../cambios/services/cambios.service';

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
        private cambiosService: CambiosService,
        @InjectModel(Trabajador.name) private trabajadorModel: Model<Trabajador>,
        @InjectModel(User.name) private userModel: Model<User>,
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
        
        const ventas = await this.ventaModel.find(query)
            .populate('trabajador', 'nombre identificador')
            .populate('usuario', 'username nombre')
            .sort({ createdAt: -1 })
            .exec();
        
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
                const pagoInicial: any = {
                    fecha: new Date(),
                    monto: pagadoRedondeado,
                    metodoPago: createVentaDto.metodoPago || 'EFECTIVO',
                    observaciones: createVentaDto.observaciones || ''
                };
                
                // Guardar el trabajador en el pago inicial si el usuario es TIENDA
                if (trabajadorId) {
                    pagoInicial.trabajador = new Types.ObjectId(trabajadorId);
                } else {
                    // Si no es TIENDA, guardar el usuario que realizó el pago
                    pagoInicial.usuario = new Types.ObjectId(userId);
                }
                
                ventaData.pagos = [pagoInicial];
            }

            // Añadir trabajador si existe
            if (trabajadorId) {
                ventaData.trabajador = trabajadorId;
            }

            const venta = new this.ventaModel(ventaData);

            const savedVenta = await venta.save();
            return savedVenta;
        } catch (error) {
            this.logger.error(`Error al crear venta: ${error.message}`, error.stack);
            throw error;
        }
    }

    async registrarPago(id: string, pagoVentaDto: PagoVentaDto, userId: string, userRole: string) {

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
            throw new NotFoundException(`Venta ${id} no encontrada`);
        }

        // Redondear todos los valores a 2 decimales
        const total = Number(venta.total.toFixed(2));
        const pagado = Number(venta.pagado.toFixed(2));
        const montoPago = Number(pagoVentaDto.pagado.toFixed(2));

        const pendiente = Number((total - pagado).toFixed(2));

        // Si el pago excede el pendiente, ajustar al pendiente (el cambio se maneja en el frontend)
        // Solo permitir esto para pagos en efectivo
        let montoPagoAjustado = montoPago;
        if (montoPago > pendiente) {
            if (pagoVentaDto.metodoPago !== 'EFECTIVO') {
                throw new BadRequestException('El pago excede el monto pendiente. Solo se permite cambio en pagos en efectivo.');
            }
            // Ajustar el monto al pendiente (el cambio se maneja en el frontend)
            montoPagoAjustado = pendiente;
        }

        const nuevoPagado = Number((pagado + montoPagoAjustado).toFixed(2));
        // Usar comparación con tolerancia para evitar problemas de precisión de punto flotante
        const nuevoEstado = Math.abs(nuevoPagado - total) < 0.01 ? 'PAGADO' : 'PAGADO_PARCIAL';

        // Registrar el pago en el historial (redondeado a 2 decimales)
        const pago: any = {
            fecha: new Date(),
            monto: montoPagoAjustado,
            metodoPago: pagoVentaDto.metodoPago,
            observaciones: pagoVentaDto.observaciones || ''
        };

        // Guardar el trabajador en el pago específico si el usuario es TIENDA
        if (trabajadorId) {
            pago.trabajador = new Types.ObjectId(trabajadorId);
        } else {
            // Si no es TIENDA, guardar el usuario que realizó el pago
            pago.usuario = new Types.ObjectId(userId);
        }

        venta.pagos = venta.pagos || [];
        // Crear un nuevo objeto pago para asegurar que se guarde correctamente
        const nuevoPago = {
            fecha: pago.fecha,
            monto: pago.monto,
            metodoPago: pago.metodoPago,
            observaciones: pago.observaciones,
            ...(pago.trabajador && { trabajador: pago.trabajador }),
            ...(pago.usuario && { usuario: pago.usuario })
        };
        venta.pagos.push(nuevoPago);
        
        // Marcar el array de pagos como modificado para que Mongoose lo guarde correctamente
        venta.markModified('pagos');

        // Actualizar la venta
        venta.pagado = nuevoPagado;
        venta.estado = nuevoEstado;
        
        // Solo asignar el trabajador a la venta si NO tiene trabajador asignado
        // Esto preserva el trabajador original que hizo la venta inicial
        // Cada pago individual tiene su propio trabajador guardado
        if (trabajadorId && !venta.trabajador) {
            venta.trabajador = trabajadorId as any;
        }

        const ventaActualizada = await venta.save();

        return ventaActualizada;
    }

    async getRecaudaciones(filtros: RecaudacionesFiltrosDto) {

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
            // Buscar usuario en la venta o en los pagos
            const condicionesUsuario = [];
            if (usuarioObjectIds.length === 1) {
                condicionesUsuario.push(
                    { usuario: usuarioObjectIds[0] },
                    { 'pagos.usuario': usuarioObjectIds[0] }
                );
            } else if (usuarioObjectIds.length > 1) {
                condicionesUsuario.push(
                    { usuario: { $in: usuarioObjectIds } },
                    { 'pagos.usuario': { $in: usuarioObjectIds } }
                );
            }
            if (condicionesUsuario.length > 0) {
                condicionesUsuarioTrabajador.push({ $or: condicionesUsuario });
            }
        }
        
        if (filtros.trabajadorId) {
            const trabajadorIds = Array.isArray(filtros.trabajadorId) ? filtros.trabajadorId : [filtros.trabajadorId];
            const trabajadorObjectIds = trabajadorIds.map(id => new Types.ObjectId(id));
            // Buscar trabajador en la venta o en los pagos
            const condicionesTrabajador = [];
            if (trabajadorObjectIds.length === 1) {
                condicionesTrabajador.push(
                    { trabajador: trabajadorObjectIds[0] },
                    { 'pagos.trabajador': trabajadorObjectIds[0] }
                );
            } else if (trabajadorObjectIds.length > 1) {
                condicionesTrabajador.push(
                    { trabajador: { $in: trabajadorObjectIds } },
                    { 'pagos.trabajador': { $in: trabajadorObjectIds } }
                );
            }
            if (condicionesTrabajador.length > 0) {
                condicionesUsuarioTrabajador.push({ $or: condicionesTrabajador });
            }
        }

        // Si hay condiciones de usuario o trabajador, usar $and para que ambas condiciones se cumplan
        // Si solo hay una condición, aplicarla directamente
        if (condicionesUsuarioTrabajador.length > 0) {
            if (condicionesUsuarioTrabajador.length === 1) {
                // Solo una condición, aplicarla directamente
                Object.assign(filtroVentas, condicionesUsuarioTrabajador[0]);
            } else {
                // Múltiples condiciones, usar $and para que ambas se cumplan
                filtroVentas.$and = condicionesUsuarioTrabajador;
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

        // Obtener ventas SIN lean primero para verificar estructura
        const ventasSinLean = await this.ventaModel
            .find(filtroVentas)
            .populate('usuario', 'username')
            .populate('trabajador', 'nombre identificador')
            .exec();
        
        // Obtener ventas con lean para procesamiento
        const ventas = await this.ventaModel
            .find(filtroVentas)
            .populate('usuario', 'username')
            .populate('trabajador', 'nombre identificador')
            .lean()
            .exec() as unknown as PopulatedVenta[];

        // Recopilar todos los IDs de trabajadores y usuarios de los pagos para hacer populate en batch
        const trabajadorIdsSet = new Set<string>();
        const usuarioIdsSet = new Set<string>();
        for (const venta of ventas) {
            if (venta.pagos && venta.pagos.length > 0) {
                for (const pago of venta.pagos) {
                    if ((pago as any).trabajador) {
                        const trabajadorId = (pago as any).trabajador;
                        if (Types.ObjectId.isValid(trabajadorId)) {
                            trabajadorIdsSet.add(trabajadorId.toString());
                        }
                    }
                    if ((pago as any).usuario) {
                        const usuarioId = (pago as any).usuario;
                        if (Types.ObjectId.isValid(usuarioId)) {
                            usuarioIdsSet.add(usuarioId.toString());
                        }
                    }
                }
            }
        }

        // Hacer populate en batch de todos los trabajadores
        const trabajadoresMap = new Map<string, any>();
        if (trabajadorIdsSet.size > 0) {
            const trabajadorIdsArray = Array.from(trabajadorIdsSet).map(id => new Types.ObjectId(id));
            const trabajadores = await this.trabajadorModel
                .find({ _id: { $in: trabajadorIdsArray } })
                .select('nombre identificador')
                .lean()
                .exec();
            
            trabajadores.forEach(trabajador => {
                trabajadoresMap.set(trabajador._id.toString(), trabajador);
            });
        }

        // Hacer populate en batch de todos los usuarios
        const usuariosMap = new Map<string, any>();
        if (usuarioIdsSet.size > 0) {
            const usuarioIdsArray = Array.from(usuarioIdsSet).map(id => new Types.ObjectId(id));
            const usuarios = await this.userModel
                .find({ _id: { $in: usuarioIdsArray } })
                .select('username')
                .lean()
                .exec();
            
            usuarios.forEach(usuario => {
                usuariosMap.set(usuario._id.toString(), usuario);
            });
        }

        // Asignar los trabajadores y usuarios populados a los pagos
        for (const venta of ventas) {
            if (venta.pagos && venta.pagos.length > 0) {
                for (const pago of venta.pagos) {
                    if ((pago as any).trabajador) {
                        const trabajadorId = (pago as any).trabajador;
                        if (Types.ObjectId.isValid(trabajadorId)) {
                            const trabajador = trabajadoresMap.get(trabajadorId.toString());
                            if (trabajador) {
                                (pago as any).trabajador = trabajador;
                            }
                        }
                    }
                    if ((pago as any).usuario) {
                        const usuarioId = (pago as any).usuario;
                        if (Types.ObjectId.isValid(usuarioId)) {
                            const usuario = usuariosMap.get(usuarioId.toString());
                            if (usuario) {
                                (pago as any).usuario = usuario;
                            }
                        }
                    }
                }
            }
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

        // Transformar reservas al formato común
        // Similar a las ventas, si hay pagos individuales, crear una fila por cada pago
        const reservasTransformadas = reservas.flatMap(reserva => {
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
                    totalPagadoAcumulado: Number(venta.pagado.toFixed(2)),
                    esMultiPago: false,
                    indicePago: 0,
                    metodoPago: venta.metodoPago, // Método de pago de la venta
                    estado: venta.estado,
                    detalles: venta.productos.map(p => ({
                        nombre: p.nombre,
                        cantidad: p.unidades,
                        precio: Number(p.precioUnitario.toFixed(2)),
                        total: Number(p.precioTotal.toFixed(2))
                    })),
                    pagos: [],
                    usandoFallback: false
                }];
            }

            // Transformar cada pago en una fila independiente
            return venta.pagos.map((pago, indicePago) => {
                // Obtener trabajador y usuario del pago específico
                const trabajadorPago = (pago as any).trabajador;
                const usuarioPago = (pago as any).usuario;
                
                // Determinar qué mostrar para ESTE pago específico:
                // 1. Si el pago tiene trabajador, usar ese trabajador (pago hecho por TIENDA)
                // 2. Si el pago tiene usuario (y no tiene trabajador), usar ese usuario (pago hecho por usuario no TIENDA)
                // 3. Si el pago no tiene ni trabajador ni usuario, usar el trabajador de la venta si existe, sino el usuario de la venta
                let trabajadorFinal = undefined;
                let usuarioFinal = venta.usuario; // Por defecto usar usuario de la venta
                
                if (trabajadorPago) {
                    // El pago tiene trabajador (hecho por TIENDA)
                    if (typeof trabajadorPago === 'object' && trabajadorPago.nombre) {
                        trabajadorFinal = trabajadorPago;
                    } else if (Types.ObjectId.isValid(trabajadorPago)) {
                        // Es un ObjectId, debería estar populado pero no lo está
                        // Intentar usar el trabajador de la venta como fallback
                        trabajadorFinal = venta.trabajador;
                    }
                } else if (usuarioPago) {
                    // El pago tiene usuario (hecho por usuario no TIENDA)
                    if (typeof usuarioPago === 'object' && usuarioPago.username) {
                        usuarioFinal = usuarioPago;
                    } else {
                        // Si es solo un ObjectId, usar el usuario de la venta (no debería pasar si el populate funcionó)
                        usuarioFinal = venta.usuario;
                    }
                } else {
                    // El pago no tiene ni trabajador ni usuario
                    // IMPORTANTE: Si el pago no tiene información de quién lo procesó, 
                    // NO podemos usar el usuario/trabajador de la venta como fallback para el filtrado
                    // porque eso haría que aparezcan pagos de otros trabajadores cuando filtramos por usuario específico
                    // En su lugar, marcamos que este pago no tiene información de procesador
                    // El filtro post-transformación deberá excluir estos pagos cuando se filtra por usuario/trabajador específico
                    if (venta.trabajador) {
                        trabajadorFinal = venta.trabajador;
                    }
                    // Marcamos que este pago usa fallback (no tiene información real de quién lo procesó)
                    (pago as any).usandoFallback = true;
                }

                // Calcular el total pagado acumulado hasta este pago
                const totalPagadoAcumulado = venta.pagos.slice(0, indicePago + 1).reduce((sum, p) => sum + p.monto, 0);
                const esMultiPago = venta.pagos.length > 1;

                return {
                    _id: venta._id,
                    tipo: 'VENTA',
                    fecha: pago.fecha, // Usar la fecha del pago en lugar de la fecha de la venta
                    socio: {
                        codigo: venta.codigoSocio,
                        nombre: venta.nombreSocio
                    },
                    // Enviar el usuario correspondiente (el frontend prioriza trabajador sobre usuario si ambos existen)
                    usuario: {
                        _id: usuarioFinal._id,
                        username: usuarioFinal.username
                    },
                    trabajador: trabajadorFinal ? {
                        _id: trabajadorFinal._id || trabajadorFinal,
                        nombre: trabajadorFinal.nombre,
                        identificador: trabajadorFinal.identificador
                    } : undefined,
                    // Marcar si este pago usa fallback (no tiene información real de quién lo procesó)
                    usandoFallback: (pago as any).usandoFallback || false,
                    total: Number(venta.total.toFixed(2)),
                    pagado: Number(pago.monto.toFixed(2)), // Monto de este pago específico
                    totalPagadoAcumulado: Number(totalPagadoAcumulado.toFixed(2)), // Total pagado acumulado hasta este pago
                    esMultiPago: esMultiPago, // Indica si la venta tiene múltiples pagos
                    indicePago: indicePago, // Índice del pago (0, 1, 2, ...)
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
                };
            });
        });

        // Obtener cambios
        const filtrosCambios: any = {};
        if (filtros.fechaInicio && filtros.fechaFin) {
            filtrosCambios.fechaInicio = filtros.fechaInicio;
            filtrosCambios.fechaFin = filtros.fechaFin;
        }
        // NO filtrar por usuario aquí porque necesitamos filtrar después por usuarioPago también

        const cambios = await this.cambiosService.findAll(filtrosCambios);

        // Filtrar cambios por usuario y/o trabajador si es necesario
        let cambiosFiltrados = cambios;
        if (filtros.usuario || filtros.trabajadorId) {
            const usuarioIds = filtros.usuario 
                ? (Array.isArray(filtros.usuario) ? filtros.usuario : [filtros.usuario])
                : [];
            const trabajadorIds = filtros.trabajadorId
                ? (Array.isArray(filtros.trabajadorId) ? filtros.trabajadorId : [filtros.trabajadorId])
                : [];
            
            cambiosFiltrados = cambios.filter(cambio => {
                const cambioDoc = cambio as any;
                
                // Verificar si coincide con el filtro de usuario
                let coincideUsuario = false;
                if (usuarioIds.length === 0) {
                    coincideUsuario = true; // No hay filtro de usuario
                } else {
                    const usuarioCambio = cambioDoc.usuario;
                    const usuarioPago = cambioDoc.usuarioPago;
                    const usuarioABuscar = usuarioPago || usuarioCambio;
                    
                    if (usuarioABuscar) {
                        const usuarioId = typeof usuarioABuscar === 'object' && usuarioABuscar._id 
                            ? usuarioABuscar._id.toString() 
                            : usuarioABuscar.toString();
                        coincideUsuario = usuarioIds.includes(usuarioId);
                    }
                }
                
                // Verificar si coincide con el filtro de trabajador
                let coincideTrabajador = false;
                if (trabajadorIds.length === 0) {
                    coincideTrabajador = true; // No hay filtro de trabajador
                } else {
                    const trabajadorPago = cambioDoc.trabajadorPago;
                    const trabajador = cambioDoc.trabajador;
                    const trabajadorABuscar = trabajadorPago || trabajador;
                    
                    if (trabajadorABuscar) {
                        const trabajadorId = typeof trabajadorABuscar === 'object' && trabajadorABuscar._id 
                            ? trabajadorABuscar._id.toString() 
                            : trabajadorABuscar.toString();
                        coincideTrabajador = trabajadorIds.includes(trabajadorId);
                    }
                }
                
                // Si hay filtros de ambos, ambos deben coincidir (AND)
                // Si solo hay uno, ese debe coincidir
                if (usuarioIds.length > 0 && trabajadorIds.length > 0) {
                    return coincideUsuario && coincideTrabajador;
                } else if (usuarioIds.length > 0) {
                    return coincideUsuario;
                } else if (trabajadorIds.length > 0) {
                    return coincideTrabajador;
                }
                
                return true;
            });
        }

        // Transformar cambios al formato común
        const cambiosTransformados = cambiosFiltrados.map(cambio => {
            const cambioDoc = cambio as any;
            const venta = cambioDoc.venta;
            const usuario = cambioDoc.usuario;
            const trabajador = cambioDoc.trabajador;
            const trabajadorPago = cambioDoc.trabajadorPago;
            const usuarioPago = cambioDoc.usuarioPago;

            // Determinar usuario/trabajador final
            // Priorizar trabajador/usuario que procesó el pago, si existe
            // Si no, usar el trabajador/usuario que hizo el cambio
            let trabajadorFinal = trabajadorPago || trabajador;
            let usuarioFinal = usuarioPago || usuario;

            return {
                _id: cambioDoc._id,
                tipo: 'CAMBIO',
                fecha: cambioDoc.createdAt,
                socio: {
                    codigo: venta?.codigoSocio || '',
                    nombre: venta?.nombreSocio || ''
                },
                usuario: {
                    _id: usuarioFinal._id,
                    username: usuarioFinal.username
                },
                trabajador: trabajadorFinal ? {
                    _id: trabajadorFinal._id,
                    nombre: trabajadorFinal.nombre,
                    identificador: trabajadorFinal.identificador || trabajadorFinal.apellidos
                } : undefined,
                total: Number(Math.abs(cambioDoc.diferenciaPrecio).toFixed(2)),
                pagado: cambioDoc.estadoPago === 'PAGADO' || cambioDoc.estadoPago === 'DEVUELTO' 
                    ? Number(Math.abs(cambioDoc.diferenciaPrecio).toFixed(2))
                    : 0,
                // Para recaudaciones, si es DEVUELTO, el pagado debe ser negativo para reflejar que es una salida de dinero
                // Si es PAGADO, el pagado es positivo (entrada de dinero)
                // Si es PENDIENTE, el pagado es 0 (aún no se ha procesado)
                pagadoRecaudacion: cambioDoc.estadoPago === 'PAGADO' 
                    ? Number(Math.abs(cambioDoc.diferenciaPrecio).toFixed(2))
                    : cambioDoc.estadoPago === 'DEVUELTO'
                        ? Number(cambioDoc.diferenciaPrecio.toFixed(2)) // diferenciaPrecio ya es negativo, así que se mantiene negativo
                        : 0,
                metodoPago: cambioDoc.metodoPago || 'EFECTIVO',
                estado: cambioDoc.estadoPago === 'PAGADO' ? 'PAGADO' : 
                       cambioDoc.estadoPago === 'DEVUELTO' ? 'DEVUELTO' : 'PENDIENTE',
                diferenciaPrecio: Number(cambioDoc.diferenciaPrecio.toFixed(2)),
                detalles: [
                    {
                        nombre: `${cambioDoc.productoOriginal.nombre} → ${cambioDoc.productoNuevo.nombre}`,
                        cantidad: cambioDoc.productoOriginal.cantidad,
                        precio: Number(cambioDoc.productoOriginal.precioUnitario.toFixed(2)),
                        total: Number(cambioDoc.productoOriginal.total.toFixed(2))
                    }
                ],
                productoOriginal: {
                    nombre: cambioDoc.productoOriginal.nombre,
                    cantidad: cambioDoc.productoOriginal.cantidad,
                    precio: Number(cambioDoc.productoOriginal.precioUnitario.toFixed(2)),
                    total: Number(cambioDoc.productoOriginal.total.toFixed(2))
                },
                productoNuevo: {
                    nombre: cambioDoc.productoNuevo.nombre,
                    cantidad: cambioDoc.productoNuevo.cantidad,
                    precio: Number(cambioDoc.productoNuevo.precioUnitario.toFixed(2)),
                    total: Number(cambioDoc.productoNuevo.total.toFixed(2))
                },
                motivo: cambioDoc.motivo,
                observaciones: cambioDoc.observaciones,
                pagos: []
            };
        });

        // Combinar reservas, ventas y cambios
        let recaudaciones = [...reservasTransformadas, ...ventasTransformadas, ...cambiosTransformados];

        // Aplicar filtro adicional de usuario/trabajador después de transformar
        // Esto es necesario porque cada pago puede tener un usuario/trabajador diferente
        if (filtros.usuario || filtros.trabajadorId) {
            const usuarioIds = filtros.usuario 
                ? (Array.isArray(filtros.usuario) ? filtros.usuario : [filtros.usuario])
                : [];
            const trabajadorIds = filtros.trabajadorId
                ? (Array.isArray(filtros.trabajadorId) ? filtros.trabajadorId : [filtros.trabajadorId])
                : [];
            
            const totalAntesFiltro = recaudaciones.length;
            
            recaudaciones = recaudaciones.filter((recaudacion: any) => {
                // Si esta recaudación usa fallback (no tiene información real de quién procesó el pago),
                // y estamos filtrando por usuario/trabajador específico, excluirla
                if (recaudacion.usandoFallback && (usuarioIds.length > 0 || trabajadorIds.length > 0)) {
                    return false;
                }
                
                // Verificar si la recaudación tiene trabajador o usuario
                const tieneTrabajador = recaudacion.trabajador !== undefined && recaudacion.trabajador !== null;
                const tieneUsuario = recaudacion.usuario !== undefined && recaudacion.usuario !== null;
                
                // Verificar si coincide con el filtro de usuario
                let coincideUsuario = false;
                if (usuarioIds.length === 0) {
                    coincideUsuario = true; // No hay filtro de usuario
                } else {
                    // Solo considerar usuario si la recaudación NO tiene trabajador
                    // Si tiene trabajador, no puede coincidir con filtro de usuario
                    if (tieneTrabajador) {
                        coincideUsuario = false;
                    } else {
                        // El usuario puede estar en recaudacion.usuario._id (objeto populado) o recaudacion.usuario (string)
                        const usuarioId = typeof recaudacion.usuario === 'object' && recaudacion.usuario?._id
                            ? recaudacion.usuario._id.toString()
                            : typeof recaudacion.usuario === 'string'
                                ? recaudacion.usuario
                                : null;
                        
                        coincideUsuario = usuarioId && usuarioIds.some(id => id.toString() === usuarioId.toString());
                    }
                }
                
                // Verificar si coincide con el filtro de trabajador
                let coincideTrabajador = false;
                if (trabajadorIds.length === 0) {
                    coincideTrabajador = true; // No hay filtro de trabajador
                } else {
                    // Solo considerar trabajador si la recaudación tiene trabajador
                    // Si no tiene trabajador, no puede coincidir con filtro de trabajador
                    if (!tieneTrabajador) {
                        coincideTrabajador = false;
                    } else {
                        // El trabajador puede estar en recaudacion.trabajador._id (objeto populado) o recaudacion.trabajador (string)
                        const trabajadorId = typeof recaudacion.trabajador === 'object' && recaudacion.trabajador?._id
                            ? recaudacion.trabajador._id.toString()
                            : typeof recaudacion.trabajador === 'string'
                                ? recaudacion.trabajador
                                : null;
                        
                        coincideTrabajador = trabajadorId && trabajadorIds.some(id => id.toString() === trabajadorId.toString());
                    }
                }
                
                // Si hay filtros de ambos, mostrar recaudaciones que coincidan con cualquiera (OR)
                // Si solo hay filtro de usuario, solo mostrar recaudaciones con usuario (no trabajador)
                // Si solo hay filtro de trabajador, solo mostrar recaudaciones con trabajador (no usuario)
                let resultado = false;
                if (usuarioIds.length > 0 && trabajadorIds.length > 0) {
                    // Filtrar por ambos: mostrar recaudaciones que coincidan con usuario O trabajador
                    resultado = coincideUsuario || coincideTrabajador;
                } else if (usuarioIds.length > 0) {
                    // Solo filtro de usuario: solo mostrar recaudaciones con usuario (excluir las que tienen trabajador)
                    resultado = coincideUsuario && !tieneTrabajador;
                } else if (trabajadorIds.length > 0) {
                    // Solo filtro de trabajador: solo mostrar recaudaciones con trabajador (excluir las que tienen usuario)
                    resultado = coincideTrabajador && tieneTrabajador;
                } else {
                    resultado = true;
                }
                
                return resultado;
            });
            
            // Log resumen del filtro
            const totalDespuesFiltro = recaudaciones.length;
            const resumenPorTipo = recaudaciones.reduce((acc: any, rec: any) => {
                acc[rec.tipo] = (acc[rec.tipo] || 0) + 1;
                return acc;
            }, {});
            const totalRecaudado: number = recaudaciones.reduce((sum: number, rec: any) => {
                const monto = rec.tipo === 'CAMBIO' && rec.pagadoRecaudacion !== undefined ? rec.pagadoRecaudacion : rec.pagado;
                return sum + (typeof monto === 'number' ? monto : 0);
            }, 0);
            
        }

        // Aplicar filtro de método de pago si está presente
        if (filtros.metodoPago && filtros.metodoPago !== 'todos') {
            const metodoPagoFiltro = filtros.metodoPago.toLowerCase();
            recaudaciones = recaudaciones.filter((recaudacion: any) => {
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
        recaudaciones.sort((a: any, b: any) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

        return recaudaciones;
    }
} 