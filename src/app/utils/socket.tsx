import { createContext, useContext, useEffect, useState, useRef, useCallback, type ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_BASE } from './api';
import type { Nota } from '../types/nota';

// ========== Tipos de eventos ==========

interface SocketEvents {
    'nota:created': (nota: Nota) => void;
    'nota:updated': (nota: Nota) => void;
    'disenadores:updated': (disenadores: string[]) => void;
}

// ========== Context ==========

interface SocketContextType {
    connected: boolean;
    onNotaCreated: (callback: (nota: Nota) => void) => () => void;
    onNotaUpdated: (callback: (nota: Nota) => void) => () => void;
    onDisenadoresUpdated: (callback: (disenadores: string[]) => void) => () => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

// ========== Provider ==========

export function SocketProvider({ children }: { children: ReactNode }) {
    const [connected, setConnected] = useState(false);
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        const socket = io(API_BASE, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('🔌 Conectado al servidor');
            setConnected(true);
        });

        socket.on('disconnect', () => {
            console.log('❌ Desconectado del servidor');
            setConnected(false);
        });

        socket.on('connect_error', (err) => {
            console.error('Error de conexión:', err.message);
            setConnected(false);
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    const onNotaCreated = useCallback((callback: (nota: Nota) => void) => {
        const socket = socketRef.current;
        if (!socket) return () => { };
        socket.on('nota:created', callback);
        return () => { socket.off('nota:created', callback); };
    }, []);

    const onNotaUpdated = useCallback((callback: (nota: Nota) => void) => {
        const socket = socketRef.current;
        if (!socket) return () => { };
        socket.on('nota:updated', callback);
        return () => { socket.off('nota:updated', callback); };
    }, []);

    const onDisenadoresUpdated = useCallback((callback: (disenadores: string[]) => void) => {
        const socket = socketRef.current;
        if (!socket) return () => { };
        socket.on('disenadores:updated', callback);
        return () => { socket.off('disenadores:updated', callback); };
    }, []);

    return (
        <SocketContext.Provider value={{ connected, onNotaCreated, onNotaUpdated, onDisenadoresUpdated }}>
            {children}
        </SocketContext.Provider>
    );
}

// ========== Hook ==========

export function useSocket() {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket debe usarse dentro de un SocketProvider');
    }
    return context;
}
