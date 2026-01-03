import { Injectable, NotFoundException, BadRequestException, Logger, ConflictException, forwardRef, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Tienda } from '../schemas/tienda.schema';
import { CreateTiendaDto } from '../dto/create-tienda.dto';
import { UpdateTiendaDto } from '../dto/update-tienda.dto';
import { UsersService } from '../../users/users.service';
import { UserRole } from '../../users/types/user-roles.enum';

@Injectable()
export class TiendasService {
    private readonly logger = new Logger(TiendasService.name);

    constructor(
        @InjectModel(Tienda.name) private tiendaModel: Model<Tienda>,
        @Inject(forwardRef(() => UsersService))
        private usersService: UsersService
    ) { }

    async create(createTiendaDto: CreateTiendaDto): Promise<Tienda> {
        // Verificar que el código no existe
        const existing = await this.tiendaModel.findOne({
            $or: [
                { codigo: createTiendaDto.codigo },
                { nombre: createTiendaDto.nombre }
            ]
        }).exec();
        
        if (existing) {
            throw new ConflictException('Ya existe una tienda con este código o nombre');
        }

        // Validar que siempre se proporcione un usuario (creando uno nuevo o asignando uno existente)
        if (!createTiendaDto.crearUsuario && !createTiendaDto.usuarioAsignado) {
            throw new BadRequestException('Debe crear un usuario nuevo o asignar un usuario existente a la tienda');
        }

        // Validar que no se intente crear usuario y asignar uno existente al mismo tiempo
        if (createTiendaDto.crearUsuario && createTiendaDto.usuarioAsignado) {
            throw new BadRequestException('No puede crear un usuario nuevo y asignar uno existente al mismo tiempo');
        }

        let usuarioAsignadoId = createTiendaDto.usuarioAsignado;

        // Si se solicita crear usuario automáticamente
        if (createTiendaDto.crearUsuario) {
            if (!createTiendaDto.username || !createTiendaDto.password || !createTiendaDto.nombreUsuario) {
                throw new BadRequestException('Para crear un usuario automáticamente debe proporcionar username, password y nombreUsuario');
            }

            // Crear el usuario TIENDA
            const nuevoUsuario = await this.usersService.create({
                username: createTiendaDto.username,
                password: createTiendaDto.password,
                nombre: createTiendaDto.nombreUsuario,
                apellidos: '',  // Opcional para usuarios TIENDA
                role: UserRole.TIENDA
            });

            usuarioAsignadoId = nuevoUsuario._id.toString();
        }

        // Validar que el usuario asignado existe y es de tipo TIENDA
        if (usuarioAsignadoId) {
            const usuario = await this.usersService.findOne(usuarioAsignadoId);
            if (usuario.role !== UserRole.TIENDA) {
                throw new BadRequestException('El usuario asignado debe tener el rol TIENDA');
            }
        }
        
        const tienda = new this.tiendaModel({
            nombre: createTiendaDto.nombre,
            codigo: createTiendaDto.codigo,
            descripcion: createTiendaDto.descripcion,
            activa: createTiendaDto.activa !== undefined ? createTiendaDto.activa : true,
            usuarioAsignado: usuarioAsignadoId
        });

        const tiendaGuardada = await tienda.save();

        // Si se creó un usuario, asignarle la tienda
        if (createTiendaDto.crearUsuario && usuarioAsignadoId) {
            await this.usersService.update(usuarioAsignadoId, {
                tienda: tiendaGuardada._id.toString()
            } as any);
        } else if (usuarioAsignadoId) {
            // Si se asignó un usuario existente, también asignarle la tienda
            await this.usersService.update(usuarioAsignadoId, {
                tienda: tiendaGuardada._id.toString()
            } as any);
        }

        return tiendaGuardada;
    }

    async findAll(): Promise<Tienda[]> {
        return this.tiendaModel.find()
            .populate('usuarioAsignado', 'username nombre')
            .exec();
    }

    async findActive(): Promise<Tienda[]> {
        return this.tiendaModel.find({ activa: true })
            .populate('usuarioAsignado', 'username nombre')
            .exec();
    }

    async findOne(id: string): Promise<Tienda> {
        const tienda = await this.tiendaModel.findById(id)
            .populate('usuarioAsignado', 'username nombre')
            .exec();
        
        if (!tienda) {
            throw new NotFoundException(`Tienda con ID ${id} no encontrada`);
        }
        
        return tienda;
    }

    async findByUsuario(usuarioId: string): Promise<Tienda | null> {
        return this.tiendaModel.findOne({ usuarioAsignado: usuarioId })
            .populate('usuarioAsignado', 'username nombre')
            .exec();
    }

    async update(id: string, updateTiendaDto: UpdateTiendaDto): Promise<Tienda> {
        // Si se actualiza el código o nombre, verificar que no existe
        if (updateTiendaDto.codigo || updateTiendaDto.nombre) {
            const existing = await this.tiendaModel.findOne({
                $or: [
                    updateTiendaDto.codigo ? { codigo: updateTiendaDto.codigo } : {},
                    updateTiendaDto.nombre ? { nombre: updateTiendaDto.nombre } : {}
                ],
                _id: { $ne: id }
            }).exec();
            
            if (existing) {
                throw new ConflictException('Ya existe una tienda con este código o nombre');
            }
        }

        // Si se actualiza el usuario asignado, actualizar también la referencia en el usuario
        if (updateTiendaDto.usuarioAsignado !== undefined) {
            const tiendaActual = await this.tiendaModel.findById(id).exec();
            
            // Si había un usuario anterior, quitarle la referencia a la tienda
            if (tiendaActual?.usuarioAsignado) {
                await this.usersService.update(tiendaActual.usuarioAsignado.toString(), {
                    tienda: undefined
                } as any);
            }

            // Si se asigna un nuevo usuario, asignarle la tienda
            if (updateTiendaDto.usuarioAsignado) {
                await this.usersService.update(updateTiendaDto.usuarioAsignado, {
                    tienda: id
                } as any);
            }
        }
        
        const tienda = await this.tiendaModel.findByIdAndUpdate(
            id,
            updateTiendaDto,
            { new: true }
        )
        .populate('usuarioAsignado', 'username nombre')
        .exec();
        
        if (!tienda) {
            throw new NotFoundException(`Tienda con ID ${id} no encontrada`);
        }
        
        return tienda;
    }

    async remove(id: string): Promise<void> {
        const result = await this.tiendaModel.findByIdAndDelete(id).exec();
        
        if (!result) {
            throw new NotFoundException(`Tienda con ID ${id} no encontrada`);
        }
    }

    async toggleActive(id: string): Promise<Tienda> {
        const tienda = await this.tiendaModel.findById(id).exec();
        if (!tienda) {
            throw new NotFoundException(`Tienda con ID ${id} no encontrada`);
        }
        tienda.activa = !tienda.activa;
        return tienda.save();
    }
}

