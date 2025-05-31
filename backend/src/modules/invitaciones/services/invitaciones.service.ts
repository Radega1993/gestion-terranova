import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Invitacion, InvitacionDocument } from '../schemas/invitacion.schema';
import { SocioInvitaciones, SocioInvitacionesDocument } from '../schemas/socio-invitaciones.schema';
import { CreateInvitacionDto } from '../dto/create-invitacion.dto';
import { UpdateInvitacionesDto } from '../dto/update-invitaciones.dto';
import { InvitacionesFiltersDto } from '../dto/invitaciones-filters.dto';
import { Socio } from '../../socios/schemas/socio.schema';

@Injectable()
export class InvitacionesService {
    private readonly logger = new Logger(InvitacionesService.name);

    constructor(
        @InjectModel(Invitacion.name) private invitacionModel: Model<InvitacionDocument>,
        @InjectModel(SocioInvitaciones.name) private socioInvitacionesModel: Model<SocioInvitacionesDocument>,
        @InjectModel(Socio.name) private socioModel: Model<Socio>
    ) { }

    private getEjercicioActual(): number {
        const hoy = new Date();
        const mes = hoy.getMonth() + 1; // getMonth() devuelve 0-11
        const año = hoy.getFullYear();
        // Si estamos antes de junio, el ejercicio es el año anterior
        return mes < 6 ? año - 1 : año;
    }

    private async getInvitacionesSocio(socioId: string, ejercicio: number): Promise<SocioInvitacionesDocument> {
        let socioInvitaciones = await this.socioInvitacionesModel.findOne({
            socio: new Types.ObjectId(socioId),
            ejercicio
        });

        if (!socioInvitaciones) {
            // Si no existe, crear con 12 invitaciones por defecto
            socioInvitaciones = await this.socioInvitacionesModel.create({
                socio: new Types.ObjectId(socioId),
                ejercicio,
                invitacionesDisponibles: 12
            });
        }

        return socioInvitaciones;
    }

    async create(createInvitacionDto: CreateInvitacionDto, userId: string): Promise<InvitacionDocument> {
        const socio = await this.socioModel.findOne({ socio: createInvitacionDto.codigoSocio });
        if (!socio) {
            throw new NotFoundException(`Socio no encontrado: ${createInvitacionDto.codigoSocio}`);
        }

        const ejercicio = this.getEjercicioActual();
        const socioInvitaciones = await this.getInvitacionesSocio(socio._id.toString(), ejercicio);

        if (socioInvitaciones.invitacionesDisponibles <= 0) {
            throw new BadRequestException('No quedan invitaciones disponibles para este socio');
        }

        // Crear la invitación
        const invitacion = await this.invitacionModel.create({
            socio: socio._id,
            fechaUso: new Date(createInvitacionDto.fechaUso),
            nombreInvitado: createInvitacionDto.nombreInvitado,
            observaciones: createInvitacionDto.observaciones,
            usuarioRegistro: new Types.ObjectId(userId),
            ejercicio
        });

        // Actualizar invitaciones disponibles
        socioInvitaciones.invitacionesDisponibles -= 1;
        socioInvitaciones.usuarioActualizacion = new Types.ObjectId(userId);
        await socioInvitaciones.save();

        return invitacion;
    }

    async findAll(filters: InvitacionesFiltersDto): Promise<InvitacionDocument[]> {
        const query: any = {};

        if (filters.fechaInicio && filters.fechaFin) {
            query.fechaUso = {
                $gte: new Date(filters.fechaInicio),
                $lte: new Date(filters.fechaFin)
            };
        }

        if (filters.codigoSocio) {
            const socio = await this.socioModel.findOne({ socio: filters.codigoSocio });
            if (socio) {
                query.socio = socio._id;
            }
        }

        if (filters.ejercicio) {
            query.ejercicio = parseInt(filters.ejercicio);
        }

        return this.invitacionModel.find(query)
            .populate('socio', 'socio nombre')
            .populate('usuarioRegistro', 'username')
            .sort({ fechaUso: -1 })
            .exec();
    }

    async updateInvitacionesSocio(
        codigoSocio: string,
        updateInvitacionesDto: UpdateInvitacionesDto,
        userId: string
    ): Promise<SocioInvitacionesDocument> {
        const socio = await this.socioModel.findOne({ socio: codigoSocio });
        if (!socio) {
            throw new NotFoundException(`Socio no encontrado: ${codigoSocio}`);
        }

        const ejercicio = this.getEjercicioActual();
        const socioInvitaciones = await this.getInvitacionesSocio(socio._id.toString(), ejercicio);

        socioInvitaciones.invitacionesDisponibles = updateInvitacionesDto.invitacionesDisponibles;
        socioInvitaciones.observaciones = updateInvitacionesDto.observaciones;
        socioInvitaciones.usuarioActualizacion = new Types.ObjectId(userId);

        return socioInvitaciones.save();
    }

    async getInvitacionesDisponibles(codigoSocio: string): Promise<any> {
        const socio = await this.socioModel.findOne({ socio: codigoSocio });
        if (!socio) {
            throw new NotFoundException(`Socio no encontrado: ${codigoSocio}`);
        }

        const ejercicio = this.getEjercicioActual();
        const socioInvitaciones = await this.getInvitacionesSocio(socio._id.toString(), ejercicio);

        const socioDoc = socio.toObject();
        return {
            socio: {
                codigo: socioDoc.socio,
                nombre: `${socioDoc.nombre.nombre} ${socioDoc.nombre.primerApellido} ${socioDoc.nombre.segundoApellido || ''}`.trim()
            },
            ejercicio,
            invitacionesDisponibles: socioInvitaciones.invitacionesDisponibles,
            observaciones: socioInvitaciones.observaciones
        };
    }

    async getResumenEjercicio(ejercicio: number): Promise<any> {
        const invitaciones = await this.invitacionModel.find({ ejercicio })
            .populate('socio', 'socio nombre')
            .populate('usuarioRegistro', 'username')
            .sort({ fechaUso: 1 })
            .exec();

        const sociosInvitaciones = await this.socioInvitacionesModel.find({ ejercicio })
            .populate('socio', 'socio nombre')
            .populate('usuarioActualizacion', 'username')
            .exec();

        return {
            invitaciones,
            sociosInvitaciones
        };
    }
} 