import { API_BASE_URL } from '../config';

export interface NormativaResponse {
    texto: string;
}

export const configuracionService = {
    async obtenerNormativa(token: string): Promise<string> {
        const response = await fetch(`${API_BASE_URL}/configuracion/normativa`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) {
            throw new Error('Error al obtener la normativa');
        }
        const data: NormativaResponse = await response.json();
        return data.texto;
    },

    async actualizarNormativa(token: string, texto: string): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/configuracion/normativa`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ texto }),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al actualizar la normativa');
        }
    }
};

