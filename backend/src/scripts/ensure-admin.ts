import { MongoClient } from 'mongodb';
import * as bcrypt from 'bcrypt';
import { config } from 'dotenv';
import { UserRole } from '../modules/users/types/user-roles.enum';

config();

export async function ensureAdmin() {
    const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');

    try {
        await client.connect();
        const db = client.db('terranova');
        const usersCollection = db.collection('users');

        // Verificar si ya existe un administrador
        const adminExists = await usersCollection.findOne({ rol: UserRole.ADMINISTRADOR });

        if (!adminExists) {
            // Crear el administrador por defecto
            const hashedPassword = await bcrypt.hash('admin123', 10);

            await usersCollection.insertOne({
                username: 'admin',
                password: hashedPassword,
                nombre: 'Administrador',
                apellidos: 'Sistema',
                email: 'admin@terranova.com',
                rol: UserRole.ADMINISTRADOR,
                activo: true,
                createdAt: new Date(),
                updatedAt: new Date()
            });

            console.log('Administrador creado exitosamente');
        } else {
            console.log('El administrador ya existe');
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.close();
    }
}

// Solo ejecutar si se llama directamente al script
if (require.main === module) {
    ensureAdmin();
} 