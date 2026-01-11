import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Reserva, EstadoReserva } from '../schemas/reserva.schema';
import { CreateReservaDto } from '../dto/create-reserva.dto';
import { UpdateReservaDto } from '../dto/update-reserva.dto';
import { LiquidarReservaDto } from '../dto/liquidar-reserva.dto';
import { CancelarReservaDto } from '../dto/cancelar-reserva.dto';
import { Trabajador } from '../../users/schemas/trabajador.schema';
import { UsersService } from '../../users/users.service';

@Injectable()
export class ReservasService {
    private readonly logger = new Logger(ReservasService.name);

    constructor(
        @InjectModel(Reserva.name) private reservaModel: Model<Reserva>,
        @InjectModel(Trabajador.name) private trabajadorModel: Model<Trabajador>,
        private usersService: UsersService
    ) { }

    private validateReservationDate(fecha: Date): void {
        const today = new Date();
        const maxDate = new Date();
        maxDate.setDate(today.getDate() + 40);

        if (fecha < today) {
            throw new BadRequestException('No se pueden hacer reservas en fechas pasadas');
        }

        if (fecha > maxDate) {
            throw new BadRequestException('No se pueden hacer reservas con más de 40 días de antelación');
        }
    }

    async create(createReservaDto: CreateReservaDto, usuarioId: string, userRole: string): Promise<Reserva> {
        try {
            // Validar la fecha de la reserva
            this.validateReservationDate(new Date(createReservaDto.fecha));

            // NUEVO: Si el usuario es TIENDA, trabajadorId es OBLIGATORIO
            let trabajadorId = null;
            if (userRole === 'TIENDA') {
                if (!createReservaDto.trabajadorId) {
                    throw new BadRequestException('Debe seleccionar un trabajador para realizar la reserva');
                }

                // Obtener la tienda del usuario
                const user = await this.usersService.findOne(usuarioId);
                if (!user.tienda) {
                    throw new BadRequestException('No tiene una tienda asignada');
                }

                // Validar que el trabajador pertenece a la tienda del usuario y está activo
                const trabajador = await this.trabajadorModel.findOne({
                    _id: createReservaDto.trabajadorId,
                    tienda: user.tienda,
                    activo: true
                }).exec();

                if (!trabajador) {
                    throw new BadRequestException('Trabajador no válido o no pertenece a esta tienda');
                }

                trabajadorId = createReservaDto.trabajadorId;
            }

            // Redondear precio y montoAbonado a 2 decimales
            const precioRedondeado = createReservaDto.precio ? Number(createReservaDto.precio.toFixed(2)) : createReservaDto.precio;

            // Si el estado es LISTA_ESPERA, forzar montoAbonado a 0 y no permitir pago
            let montoAbonadoRedondeado = 0;
            if (createReservaDto.estado === EstadoReserva.LISTA_ESPERA) {
                // Las reservas en lista de espera no pueden tener pago
                montoAbonadoRedondeado = 0;
            } else {
                montoAbonadoRedondeado = createReservaDto.montoAbonado ? Number(createReservaDto.montoAbonado.toFixed(2)) : (createReservaDto.montoAbonado || 0);
            }

            // Determinar el estado basado en el pago
            // Si se envía un estado especial (LISTA_ESPERA, CANCELADA), respetarlo
            // De lo contrario, determinar el estado basado en el pago
            let estadoReserva = createReservaDto.estado;

            // Si no se envía estado o es PENDIENTE, determinar basado en el pago
            if (!estadoReserva || estadoReserva === EstadoReserva.PENDIENTE) {
                if (montoAbonadoRedondeado && precioRedondeado) {
                    // Si el monto abonado es igual o mayor al precio (con tolerancia de 0.01), está completada
                    if (Math.abs(montoAbonadoRedondeado - precioRedondeado) < 0.01) {
                        estadoReserva = EstadoReserva.COMPLETADA;
                    } else if (montoAbonadoRedondeado > 0) {
                        estadoReserva = EstadoReserva.PENDIENTE; // Pago parcial, sigue pendiente
                    } else {
                        estadoReserva = EstadoReserva.PENDIENTE; // Sin pago, pendiente
                    }
                } else {
                    estadoReserva = EstadoReserva.PENDIENTE; // Sin información de pago, pendiente
                }
            }

            const reservaData: any = {
                ...createReservaDto,
                precio: precioRedondeado,
                montoAbonado: montoAbonadoRedondeado,
                usuarioCreacion: usuarioId,
                estado: estadoReserva
            };

            // Añadir trabajador si existe
            if (trabajadorId) {
                reservaData.trabajador = trabajadorId;
            }

            const reserva = new this.reservaModel(reservaData);
            return await reserva.save();
        } catch (error) {
            this.logger.error('Error al crear reserva:', error);
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException('Error al crear la reserva');
        }
    }

    async findAll(): Promise<Reserva[]> {
        try {
            const reservas = await this.reservaModel.find()
                .populate('socio', 'nombre')
                .populate('trabajador', 'nombre identificador')
                .populate('usuarioCreacion', 'username nombre')
                .exec();
            return reservas;
        } catch (error) {
            this.logger.error('Error al obtener reservas:', error);
            throw new BadRequestException('Error al obtener las reservas');
        }
    }

    async findOne(id: string): Promise<Reserva> {
        try {
            const reserva = await this.reservaModel.findById(id)
                .populate('socio', 'nombre')
                .populate('trabajador', 'nombre identificador')
                .populate('usuarioCreacion', 'username nombre')
                .exec();

            if (!reserva) {
                throw new NotFoundException(`Reserva con ID ${id} no encontrada`);
            }

            return reserva;
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            this.logger.error(`Error al obtener reserva con ID ${id}:`, error);
            throw new BadRequestException('Error al obtener la reserva');
        }
    }

    async update(id: string, updateReservaDto: UpdateReservaDto, usuarioId: string): Promise<Reserva> {
        try {
            // Si se está actualizando la fecha, validarla
            if (updateReservaDto.fecha) {
                this.validateReservationDate(new Date(updateReservaDto.fecha));
            }

            const reserva = await this.reservaModel.findById(id);

            if (!reserva) {
                throw new NotFoundException(`Reserva con ID ${id} no encontrada`);
            }

            if (reserva.estado === EstadoReserva.LIQUIDADA) {
                throw new BadRequestException('No se puede modificar una reserva liquidada');
            }

            // Redondear precio y montoAbonado a 2 decimales si están presentes
            const updateData: any = { ...updateReservaDto };
            let precioFinal = reserva.precio;
            let montoAbonadoFinal = reserva.montoAbonado || 0;

            if (updateReservaDto.precio !== undefined) {
                precioFinal = Number(updateReservaDto.precio.toFixed(2));
                updateData.precio = precioFinal;
            }
            if (updateReservaDto.montoAbonado !== undefined) {
                montoAbonadoFinal = Number(updateReservaDto.montoAbonado.toFixed(2));
                updateData.montoAbonado = montoAbonadoFinal;
            }

            // Determinar el estado basado en el pago
            // Solo actualizar el estado si no se envía un estado explícito o si es PENDIENTE
            // Respetar estados especiales como LISTA_ESPERA, CANCELADA, etc.
            if (!updateReservaDto.estado || updateReservaDto.estado === EstadoReserva.PENDIENTE) {
                // Si el monto abonado es igual o mayor al precio (con tolerancia de 0.01), está completada
                if (Math.abs(montoAbonadoFinal - precioFinal) < 0.01 && montoAbonadoFinal > 0) {
                    updateData.estado = EstadoReserva.COMPLETADA;
                } else if (montoAbonadoFinal > 0 && montoAbonadoFinal < precioFinal) {
                    // Si hay pago parcial pero no completo, mantener PENDIENTE
                    updateData.estado = EstadoReserva.PENDIENTE;
                } else if (montoAbonadoFinal === 0) {
                    // Sin pago, mantener PENDIENTE
                    updateData.estado = EstadoReserva.PENDIENTE;
                }
            }

            const reservaActualizada = await this.reservaModel.findByIdAndUpdate(
                id,
                {
                    ...updateData,
                    usuarioActualizacion: usuarioId
                },
                { new: true }
            )
                .populate('socio', 'nombre')
                .populate('trabajador', 'nombre identificador')
                .populate('usuarioCreacion', 'username nombre')
                .exec();

            return reservaActualizada;
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            this.logger.error(`Error al actualizar reserva con ID ${id}:`, error);
            throw new BadRequestException('Error al actualizar la reserva');
        }
    }

    async remove(id: string): Promise<void> {
        try {
            const reserva = await this.reservaModel.findById(id);

            if (!reserva) {
                throw new NotFoundException(`Reserva con ID ${id} no encontrada`);
            }

            if (reserva.estado === EstadoReserva.LIQUIDADA) {
                throw new BadRequestException('No se puede eliminar una reserva liquidada');
            }

            await this.reservaModel.findByIdAndDelete(id);
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            this.logger.error(`Error al eliminar reserva con ID ${id}:`, error);
            throw new BadRequestException('Error al eliminar la reserva');
        }
    }

    async liquidar(id: string, liquidarReservaDto: LiquidarReservaDto, usuarioId: string): Promise<Reserva> {
        try {
            const reserva = await this.reservaModel.findById(id);

            if (!reserva) {
                throw new NotFoundException(`Reserva con ID ${id} no encontrada`);
            }

            if (reserva.estado === EstadoReserva.COMPLETADA) {
                throw new BadRequestException('La reserva ya está completada');
            }

            if (reserva.estado === EstadoReserva.CANCELADA) {
                throw new BadRequestException('No se puede liquidar una reserva cancelada');
            }

            // Calcular el monto total abonado y redondear a 2 decimales
            const montoTotalAbonado = Number(liquidarReservaDto.pagos.reduce((total, pago) => total + Number(pago.monto.toFixed(2)), 0).toFixed(2));

            const reservaLiquidada = await this.reservaModel.findByIdAndUpdate(
                id,
                {
                    estado: EstadoReserva.COMPLETADA,
                    montoAbonado: montoTotalAbonado,
                    metodoPago: liquidarReservaDto.pagos[liquidarReservaDto.pagos.length - 1].metodoPago,
                    observaciones: liquidarReservaDto.observaciones,
                    suplementos: liquidarReservaDto.suplementos,
                    fianza: liquidarReservaDto.fianza || 0
                },
                { new: true }
            )
                .populate('socio', 'nombre')
                .populate('trabajador', 'nombre identificador')
                .populate('usuarioCreacion', 'username nombre')
                .populate('suplementos.suplemento', 'nombre')
                .exec();

            return reservaLiquidada;
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            this.logger.error(`Error al liquidar reserva con ID ${id}:`, error);
            throw new BadRequestException('Error al liquidar la reserva');
        }
    }

    async cancelar(id: string, cancelarReservaDto: CancelarReservaDto, usuarioId: string): Promise<Reserva> {
        try {
            const reserva = await this.reservaModel.findById(id);

            if (!reserva) {
                throw new NotFoundException(`Reserva con ID ${id} no encontrada`);
            }

            if (reserva.estado === EstadoReserva.CANCELADA) {
                throw new BadRequestException('La reserva ya está cancelada');
            }

            if (reserva.estado === EstadoReserva.LIQUIDADA) {
                throw new BadRequestException('No se puede cancelar una reserva liquidada');
            }

            // Calcular el importe pendiente y redondear a 2 decimales
            const montoAbonado = Number((reserva.montoAbonado || 0).toFixed(2));
            const precioRedondeado = Number(reserva.precio.toFixed(2));
            const importePendiente = Number((precioRedondeado - montoAbonado).toFixed(2));

            // Si se especifica un monto devuelto en el DTO, usarlo; si no, usar el importe pendiente
            const montoDevuelto = cancelarReservaDto.montoDevuelto !== undefined
                ? cancelarReservaDto.montoDevuelto
                : importePendiente;

            // Actualizar la reserva: quitar el importe pendiente y marcar devolución
            const reservaCancelada = await this.reservaModel.findByIdAndUpdate(
                id,
                {
                    estado: EstadoReserva.CANCELADA,
                    fechaCancelacion: new Date(),
                    motivoCancelacion: cancelarReservaDto.motivo,
                    observaciones: cancelarReservaDto.observaciones,
                    montoDevuelto: montoDevuelto,
                    montoAbonado: 0, // Quitar el importe pendiente (poner abonado a 0)
                    pendienteRevisionJunta: cancelarReservaDto.pendienteRevisionJunta || false,
                    usuarioActualizacion: usuarioId
                },
                { new: true }
            )
                .populate('socio', 'nombre')
                .populate('trabajador', 'nombre identificador')
                .populate('usuarioCreacion', 'username nombre')
                .populate('servicios.servicio', 'nombre')
                .populate('suplementos.suplemento', 'nombre')
                .exec();


            return reservaCancelada;
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            this.logger.error(`Error al cancelar reserva con ID ${id}:`, error);
            throw new BadRequestException('Error al cancelar la reserva');
        }
    }

    async findByUsuario(usuarioId: string): Promise<Reserva[]> {
        try {
            return await this.reservaModel.find({ socio: usuarioId })
                .populate('socio', 'nombre')
                .populate('trabajador', 'nombre identificador')
                .populate('usuarioCreacion', 'username nombre')
                .exec();
        } catch (error) {
            this.logger.error(`Error al buscar reservas para el usuario ${usuarioId}:`, error);
            throw new BadRequestException('Error al buscar las reservas del usuario');
        }
    }

    async findByFecha(fecha: Date): Promise<Reserva[]> {
        try {
            // Establecer la hora de inicio al principio del día (00:00:00)
            const inicioDia = new Date(fecha);
            inicioDia.setHours(0, 0, 0, 0);

            // Establecer la hora de fin al final del día (23:59:59.999)
            const finDia = new Date(fecha);
            finDia.setHours(23, 59, 59, 999);


            const reservas = await this.reservaModel.find({
                fecha: {
                    $gte: inicioDia,
                    $lte: finDia
                }
            })
                .populate('socio', 'nombre')
                .populate('trabajador', 'nombre identificador')
                .populate('usuarioCreacion', 'username nombre')
                .exec();

            return reservas;
        } catch (error) {
            this.logger.error(`Error al buscar reservas para la fecha ${fecha}:`, error);
            throw new BadRequestException('Error al buscar las reservas por fecha');
        }
    }
} 