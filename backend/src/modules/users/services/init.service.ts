import { Injectable, OnModuleInit } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserRole } from '../types/user-roles.enum';

@Injectable()
export class InitService implements OnModuleInit {
    constructor(private readonly usersService: UsersService) { }

    async onModuleInit() {
        try {
            await this.usersService.findOneByUsername('admin');
        } catch (error) {
            // Si el usuario admin no existe, lo creamos
            await this.usersService.create({
                username: 'admin',
                password: 'admin',
                nombre: 'Administrador',
                apellidos: 'Sistema',
                email: 'admin@terranova.com',
                rol: UserRole.ADMINISTRADOR,
                activo: true
            });
            console.log('Usuario administrador creado');
        }
    }
} 