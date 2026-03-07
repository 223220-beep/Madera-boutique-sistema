// Configuración del servidor
// Si estás en la computadora del servidor, usa localhost
// Si estás en otra computadora de la red, cambia a la IP del servidor
const SERVER_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3001'
    : `http://${window.location.hostname}:3001`;

export const API_BASE = SERVER_URL;

// Generador de ID seguro para contextos no-HTTPS
export const generateId = () => {
    try {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
    } catch (e) { }
    return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
};

// ========== Funciones auxiliares ==========

async function request(endpoint: string, options?: RequestInit) {
    const url = `${API_BASE}${endpoint}`;
    console.log(`📡 [API Request] ${options?.method || 'GET'} ${url}`);

    try {
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
            },
            ...options,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Error desconocido' }));
            console.error(`❌ [API Error] ${response.status} ${url}`, error);
            throw new Error(error.error || `HTTP ${response.status}`);
        }

        return response.json();
    } catch (err) {
        console.error(`🔥 [Network Error] ${url}`, err);
        throw err;
    }
}

// ========== API de Notas ==========

export const notasApi = {
    getAll: () => request('/api/notas'),

    getById: (id: string) => request(`/api/notas/${id}`),

    create: (data: any) =>
        request('/api/notas', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    update: (id: string, data: any) =>
        request(`/api/notas/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),

    patch: (id: string, data: any) =>
        request(`/api/notas/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        }),
};

// ========== API de Diseñadores ==========

export const disenadoresApi = {
    getAll: (): Promise<string[]> => request('/api/disenadores'),

    add: (nombre: string) =>
        request('/api/disenadores', {
            method: 'POST',
            body: JSON.stringify({ nombre }),
        }),

    update: (oldNombre: string, nuevoNombre: string) =>
        request(`/api/disenadores/${encodeURIComponent(oldNombre)}`, {
            method: 'PUT',
            body: JSON.stringify({ nuevoNombre }),
        }),

    delete: (nombre: string) =>
        request(`/api/disenadores/${encodeURIComponent(nombre)}`, {
            method: 'DELETE',
        }),
};
