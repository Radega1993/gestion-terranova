import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Reserva, EstadoReserva } from '../schemas/reserva.schema';
import { CreateReservaDto, UpdateReservaDto } from '../dto/reserva.dto';
import { LiquidarReservaDto } from '../dto/liquidar-reserva.dto';
import { CancelarReservaDto } from '../dto/cancelar-reserva.dto';

@Injectable()
export class ReservasService {
    private readonly logger = new Logger(ReservasService.name);

    constructor(
        @InjectModel(Reserva.name) private reservaModel: Model<Reserva>
    ) { }

    async create(createReservaDto: CreateReservaDto, usuarioId: string): Promise<Reserva> {
        try {
            const reserva = new this.reservaModel({
                ...createReservaDto,
                usuarioCreacion: usuarioId,
                estado: 'PENDIENTE'
            });
            return await reserva.save();
        } catch (error) {
            this.logger.error('Error al crear reserva:', error);
            throw new BadRequestException('Error al crear la reserva');
        }
    }

    async findAll(): Promise<Reserva[]> {
        try {
            return await this.reservaModel.find()
                .populate('socio', 'nombre')
                .populate('servicios.servicio', 'nombre')
                .populate('suplementos.suplemento', 'nombre')
                .exec();
        } catch (error) {
            this.logger.error('Error al obtener reservas:', error);
            throw new BadRequestException('Error al obtener las reservas');
        }
    }

    async findOne(id: string): Promise<Reserva> {
        try {
            const reserva = await this.reservaModel.findById(id)
                .populate('socio', 'nombre')
                .populate('servicios.servicio', 'nombre')
                .populate('suplementos.suplemento', 'nombre')
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
            const reserva = await this.reservaModel.findById(id);

            if (!reserva) {
                throw new NotFoundException(`Reserva con ID ${id} no encontrada`);
            }

            if (reserva.estado === EstadoReserva.LIQUIDADA) {
                throw new BadRequestException('No se puede modificar una reserva liquidada');
            }

            const reservaActualizada = await this.reservaModel.findByIdAndUpdate(
                id,
                {
                    ...updateReservaDto,
                    usuarioActualizacion: usuarioId
                },
                { new: true }
            )
                .populate('socio', 'nombre')
                .populate('servicios.servicio', 'nombre')
                .populate('suplementos.suplemento', 'nombre')
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

            if (reserva.estado === EstadoReserva.LIQUIDADA) {
                throw new BadRequestException('La reserva ya está liquidada');
            }

            if (reserva.estado === EstadoReserva.CANCELADA) {
                throw new BadRequestException('No se puede liquidar una reserva cancelada');
            }

            const reservaLiquidada = await this.reservaModel.findByIdAndUpdate(
                id,
                {
                    estado: EstadoReserva.LIQUIDADA,
                    usuarioActualizacion: usuarioId
                },
                { new: true }
            )
                .populate('socio', 'nombre')
                .populate('servicios.servicio', 'nombre')
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

            const reservaCancelada = await this.reservaModel.findByIdAndUpdate(
                id,
                {
                    estado: EstadoReserva.CANCELADA,
                    observaciones: cancelarReservaDto.observaciones,
                    usuarioActualizacion: usuarioId
                },
                { new: true }
            )
                .populate('socio', 'nombre')
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
                .populate('servicios.servicio', 'nombre')
                .populate('suplementos.suplemento', 'nombre')
                .exec();
        } catch (error) {
            this.logger.error(`Error al buscar reservas para el usuario ${usuarioId}:`, error);
            throw new BadRequestException('Error al buscar las reservas del usuario');
        }
    }

    async findByFecha(fecha: Date): Promise<Reserva[]> {
        try {
            const inicioDia = new Date(fecha);
            inicioDia.setHours(0, 0, 0, 0);

            const finDia = new Date(fecha);
            finDia.setHours(23, 59, 59, 999);

            return await this.reservaModel.find({
                fecha: { $gte: inicioDia, $lte: finDia }
            })
                .populate('socio', 'nombre')
                .populate('servicios.servicio', 'nombre')
                .populate('suplementos.suplemento', 'nombre')
                .exec();
        } catch (error) {
            this.logger.error(`Error al buscar reservas para la fecha ${fecha}:`, error);
            throw new BadRequestException('Error al buscar las reservas por fecha');
        }
    }

    async confirmar(id: string, usuarioId: string): Promise<Reserva> {
        try {
            const reserva = await this.reservaModel.findById(id);

            if (!reserva) {
                throw new NotFoundException(`Reserva con ID ${id} no encontrada`);
            }

            if (reserva.estado === EstadoReserva.CONFIRMADA) {
                throw new BadRequestException('La reserva ya está confirmada');
            }

            if (reserva.estado === EstadoReserva.CANCELADA) {
                throw new BadRequestException('No se puede confirmar una reserva cancelada');
            }

            if (reserva.estado === EstadoReserva.LIQUIDADA) {
                throw new BadRequestException('No se puede confirmar una reserva liquidada');
            }

            const reservaConfirmada = await this.reservaModel.findByIdAndUpdate(
                id,
                {
                    estado: EstadoReserva.CONFIRMADA,
                    confirmadoPor: usuarioId,
                    fechaConfirmacion: new Date(),
                    usuarioActualizacion: usuarioId
                },
                { new: true }
            )
                .populate('socio', 'nombre')
                .populate('servicios.servicio', 'nombre')
                .populate('suplementos.suplemento', 'nombre')
                .exec();

            return reservaConfirmada;
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            this.logger.error(`Error al confirmar reserva con ID ${id}:`, error);
            throw new BadRequestException('Error al confirmar la reserva');
        }
    }

    async completar(id: string): Promise<Reserva> {
        try {
            const reserva = await this.reservaModel.findById(id);

            if (!reserva) {
                throw new NotFoundException(`Reserva con ID ${id} no encontrada`);
            }

            if (reserva.estado === EstadoReserva.COMPLETADA) {
                throw new BadRequestException('La reserva ya está completada');
            }

            if (reserva.estado === EstadoReserva.CANCELADA) {
                throw new BadRequestException('No se puede completar una reserva cancelada');
            }

            const reservaCompletada = await this.reservaModel.findByIdAndUpdate(
                id,
                {
                    estado: EstadoReserva.COMPLETADA
                },
                { new: true }
            )
                .populate('socio', 'nombre')
                .populate('servicios.servicio', 'nombre')
                .populate('suplementos.suplemento', 'nombre')
                .exec();

            return reservaCompletada;
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            this.logger.error(`Error al completar reserva con ID ${id}:`, error);
            throw new BadRequestException('Error al completar la reserva');
        }
    }
} 