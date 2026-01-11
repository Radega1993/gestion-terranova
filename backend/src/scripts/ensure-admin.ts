import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../modules/users/schemas/user.schema';
import { UserRole } from '../modules/users/types/user-roles.enum';
import * as bcrypt from 'bcrypt';

@Injectable()
export class EnsureAdminService {
    private readonly logger = new Logger(EnsureAdminService.name);

    constructor(
        @InjectModel(User.name) private userModel: Model<User>,
    ) { }

    async ensureAdmin() {
        try {
            // Verificar si ya existe un usuario admin
            const existingAdmin = await this.userModel.findOne({ username: 'admin' });

            if (existingAdmin) {
                return;
            }

            // Si no existe, crear el usuario admin
            const hashedPassword = await bcrypt.hash('admin123', 10);
            const adminUser = new this.userModel({
                username: 'admin',
                password: hashedPassword,
                nombre: 'Administrador',
                apellidos: 'Sistema',
                role: UserRole.ADMINISTRADOR,
                isActive: true,
            });

            await adminUser.save();
        } catch (error) {
            this.logger.error('Error al crear usuario admin:', error);
        }
    }
}

export async function ensureAdmin() {
    const logger = new Logger('EnsureAdmin');
    try {
        const { AppModule } = await import('../app.module');
        const { NestFactory } = await import('@nestjs/core');
        const app = await NestFactory.createApplicationContext(AppModule);
        const ensureAdminService = app.get(EnsureAdminService);
        await ensureAdminService.ensureAdmin();
        await app.close();
    } catch (error) {
        logger.error('Error al ejecutar ensureAdmin:', error);
    }
}

// Solo ejecutar si se llama directamente al script
if (require.main === module) {
    ensureAdmin();
} 