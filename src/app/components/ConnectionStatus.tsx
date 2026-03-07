import { useSocket } from "../utils/socket";

export function ConnectionStatus() {
    const { connected } = useSocket();

    return (
        <div
            className={`fixed bottom-4 right-4 px-4 py-2 rounded-full text-sm font-medium shadow-lg transition-all duration-300 z-50 flex items-center gap-2 ${connected
                    ? "bg-green-100 text-green-800 border border-green-300"
                    : "bg-red-100 text-red-800 border border-red-300 animate-pulse"
                }`}
        >
            <span
                className={`w-2.5 h-2.5 rounded-full ${connected ? "bg-green-500" : "bg-red-500"
                    }`}
            />
            {connected ? "Conectado" : "Sin conexión al servidor"}
        </div>
    );
}
