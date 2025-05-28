import axios from 'axios';
import { Socio } from '../types/socio';
import { API_BASE_URL } from '../config';

const getToken = () => {
    return localStorage.getItem('token') ||
        localStorage.getItem('gestion-terranova') ||
        localStorage.getItem('access_token');
};

export const getSocios = async (): Promise<Socio[]> => {
    const token = getToken();
    const response = await axios.get(`${API_BASE_URL}/socios`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return response.data;
};

export const getSocio = async (id: string): Promise<Socio> => {
    const token = getToken();
    const response = await axios.get(`${API_BASE_URL}/socios/${id}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return response.data;
};

export const createSocio = async (data: Socio): Promise<Socio> => {
    const token = getToken();
    const response = await axios.post(`${API_BASE_URL}/socios`, data, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return response.data;
};

export const updateSocio = async (id: string, data: Socio): Promise<Socio> => {
    const token = getToken();
    const response = await axios.put(`${API_BASE_URL}/socios/${id}`, data, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return response.data;
};

export const deleteSocio = async (id: string): Promise<void> => {
    const token = getToken();
    await axios.delete(`${API_BASE_URL}/socios/${id}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
}; 