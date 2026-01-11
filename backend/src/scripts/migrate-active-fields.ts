import mongoose, { connect } from 'mongoose';
import { config } from 'dotenv';

config();

async function migrateActiveFields() {
    try {
        // Conectar a la base de datos
        await connect(process.env.MONGODB_URI);

        // Obtener la colección de socios
        const db = mongoose.connection.db;
        const sociosCollection = db.collection('socios');

        // Actualizar todos los documentos
        const result = await sociosCollection.updateMany(
            {},
            [
                {
                    $set: {
                        active: {
                            $cond: {
                                if: { $eq: [{ $ifNull: ['$active', null] }, null] },
                                then: {
                                    $cond: {
                                        if: { $eq: [{ $ifNull: ['$isActive', null] }, null] },
                                        then: { $eq: ['$activo', 1] },
                                        else: '$isActive'
                                    }
                                },
                                else: '$active'
                            }
                        }
                    }
                },
                {
                    $unset: ['activo', 'isActive']
                }
            ]
        );

    } catch (error) {
        console.error('Error durante la migración:', error);
    } finally {
        await mongoose.connection.close();
    }
}

migrateActiveFields(); 