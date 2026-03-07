import { useRouteError, isRouteErrorResponse } from "react-router";
import { Button } from "./ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

export function ErrorPage() {
    const error = useRouteError();
    console.error("Critical Application Error:", error);

    let errorMessage: string;

    if (isRouteErrorResponse(error)) {
        errorMessage = error.statusText || error.data?.message || "Error de navegación";
    } else if (error instanceof Error) {
        errorMessage = error.message;
    } else if (typeof error === "string") {
        errorMessage = error;
    } else {
        errorMessage = "Error desconocido";
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 text-center">
            <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full border-2 border-red-100">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 text-red-600">
                    <AlertTriangle className="w-10 h-10" />
                </div>

                <h1 className="text-2xl font-bold text-gray-900 mb-2">¡Ups! Algo salió mal</h1>
                <p className="text-gray-600 mb-6">
                    Se produjo un error al intentar cargar esta parte de la aplicación.
                </p>

                <div className="bg-red-50 rounded-lg p-4 mb-8 text-left border border-red-200">
                    <p className="text-xs font-mono text-red-800 break-all">
                        <span className="font-bold uppercase">Detalles del error:</span><br />
                        {errorMessage}
                    </p>
                </div>

                <div className="flex flex-col gap-3">
                    <Button
                        onClick={() => window.location.reload()}
                        className="bg-[#ff7908] hover:bg-[#ffac08] text-white w-full py-6 text-lg"
                    >
                        <RefreshCw className="mr-2 h-5 w-5" />
                        Recargar Aplicación
                    </Button>

                    <Button
                        variant="ghost"
                        onClick={() => window.location.href = "/"}
                        className="text-gray-500"
                    >
                        Ir al Inicio
                    </Button>
                </div>

                <p className="mt-8 text-[10px] text-gray-400 uppercase tracking-widest">
                    Madera Boutique - Error Diagnostic
                </p>
            </div>
        </div>
    );
}
