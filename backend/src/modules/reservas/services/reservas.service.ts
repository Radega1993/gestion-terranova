import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Reserva } from '../schemas/reserva.schema';
import { CreateReservaDto } from '../dto/create-reserva.dto';
import { UpdateReservaDto } from '../dto/update-reserva.dto';

@Injectable()
export class ReservasService {
    constructor(
        @InjectModel(Reserva.name) private reservaModel: Model<Reserva>
    ) { }

    async findAll(): Promise<Reserva[]> {
        return this.reservaModel.find()
            .populate('socio', 'nombre apellidos')
            .populate('suplementos')
            .exec();
    }

    async findOne(id: string): Promise<Reserva> {
        const reserva = await this.reservaModel.findById(id)
            .populate('socio', 'nombre apellidos')
            .populate('suplementos')
            .exec();

        if (!reserva) {
            throw new NotFoundException(`Reserva con ID ${id} no encontrada`);
        }

        return reserva;
    }

    async create(createReservaDto: CreateReservaDto): Promise<Reserva> {
        const reserva = new this.reservaModel(createReservaDto);
        return reserva.save();
    }

    async update(id: string, updateReservaDto: UpdateReservaDto): Promise<Reserva> {
        const reserva = await this.reservaModel.findByIdAndUpdate(
            id,
            updateReservaDto,
            { new: true }
        )
            .populate('socio', 'nombre apellidos')
            .populate('suplementos')
            .exec();

        if (!reserva) {
            throw new NotFoundException(`Reserva con ID ${id} no encontrada`);
        }

        return reserva;
    }

    async remove(id: string): Promise<void> {
        const result = await this.reservaModel.deleteOne({ _id: id }).exec();
        if (result.deletedCount === 0) {
            throw new NotFoundException(`Reserva con ID ${id} no encontrada`);
        }
    }
} 