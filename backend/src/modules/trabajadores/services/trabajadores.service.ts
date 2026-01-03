import { Injectable, NotFoundException, BadRequestException, Logger, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Trabajador } from '../../users/schemas/trabajador.schema';
import { CreateTrabajadorDto } from '../dto/create-trabajador.dto';
import { UpdateTrabajadorDto } from '../dto/update-trabajador.dto';
import { Tienda } from '../../tiendas/schemas/tienda.schema';

@Injectable()
export class TrabajadoresService {
    private readonly logger = new Logger(TrabajadoresService.name);

    constructor(
        @InjectModel(Trabajador.name) private trabajadorModel: Model<Trabajador>,
        @InjectModel(Tienda.name) private tiendaModel: Model<Tienda>
    ) { }

    async create(createTrabajadorDto: CreateTrabajadorDto, tiendaId?: string): Promise<Trabajador> {
        // Validar que existe la tienda
        const tiendaIdToUse = createTrabajadorDto.tienda || tiendaId;
        if (!tiendaIdToUse) {
            throw new BadRequestException('Debe especificar una tienda para crear el trabajador');
        }

        const tienda = await this.tiendaModel.findById(tiendaIdToUse).exec();
        if (!tienda) {
            throw new NotFoundException('Tienda no encontrada');
        }

        if (!tienda.activa) {
            throw new BadRequestException('No se pueden crear trabajadores para una tienda inactiva');
        }

        // Verificar que el identificador no existe
        const existing = await this.trabajadorModel.findOne({
            identificador: createTrabajadorDto.identificador
        }).exec();
        
        if (existing) {
            throw new ConflictException('Ya existe un trabajador con este identificador');
        }
        
        const trabajador = new this.trabajadorModel({
            ...createTrabajadorDto,
            tienda: tiendaIdToUse
        });
        return trabajador.save();
    }

    async findAll(tiendaId?: string): Promise<Trabajador[]> {
        const filter = tiendaId ? { tienda: tiendaId } : {};
        return this.trabajadorModel.find(filter)
            .populate('tienda', 'nombre codigo')
            .exec();
    }

    async findByTienda(tiendaId: string): Promise<Trabajador[]> {
        return this.trabajadorModel.find({ 
            tienda: tiendaId,
            activo: true 
        })
        .populate('tienda', 'nombre codigo')
        .exec();
    }

    async findOne(id: string): Promise<Trabajador> {
        const trabajador = await this.trabajadorModel.findById(id)
            .populate('tienda', 'nombre codigo')
            .exec();
        
        if (!trabajador) {
            throw new NotFoundException(`Trabajador con ID ${id} no encontrado`);
        }
        
        return trabajador;
    }

    async update(id: string, updateTrabajadorDto: UpdateTrabajadorDto): Promise<Trabajador> {
        // Si se actualiza el identificador, verificar que no existe
        if (updateTrabajadorDto.identificador) {
            const existing = await this.trabajadorModel.findOne({
                identificador: updateTrabajadorDto.identificador,
                _id: { $ne: id }
            }).exec();
            
            if (existing) {
                throw new ConflictException('Ya existe un trabajador con este identificador');
            }
        }
        
        const trabajador = await this.trabajadorModel.findByIdAndUpdate(
            id,
            updateTrabajadorDto,
            { new: true }
        ).exec();
        
        if (!trabajador) {
            throw new NotFoundException(`Trabajador con ID ${id} no encontrado`);
        }
        
        return trabajador;
    }

    async remove(id: string): Promise<void> {
        const result = await this.trabajadorModel.findByIdAndDelete(id).exec();
        
        if (!result) {
            throw new NotFoundException(`Trabajador con ID ${id} no encontrado`);
        }
    }

    async toggleActive(id: string): Promise<Trabajador> {
        const trabajador = await this.trabajadorModel.findById(id).exec();
        if (!trabajador) {
            throw new NotFoundException(`Trabajador con ID ${id} no encontrado`);
        }
        trabajador.activo = !trabajador.activo;
        return trabajador.save();
    }
}

