import { useState, useEffect } from "react";
import { Nota, ItemNota } from "../types/nota";
import { itemsApi, notasApi } from "../utils/api";
import { Button } from "./ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "./ui/dialog";
import { Badge } from "./ui/badge";
import { CheckCircle2, Package, Truck } from "lucide-react";
import { toast } from "sonner";

interface ObjetosDialogProps {
    nota: Nota;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUpdate: () => void;
}

export function ObjetosDialog({ nota, open, onOpenChange, onUpdate }: ObjetosDialogProps) {
    const [items, setItems] = useState<ItemNota[]>([]);

    useEffect(() => {
        if (nota) {
            setItems([...nota.items]);
        }
    }, [nota]);

    const toggleTerminado = async (item: ItemNota) => {
        try {
            const newState = !item.terminado;
            await itemsApi.patch(item.id, { terminado: newState });

            const newItems = items.map(i => i.id === item.id ? { ...i, terminado: newState } : i);
            setItems(newItems);
            toast.success(newState ? "Producto marcado como terminado ✓" : "Producto desmarcado");

            if (newState && !nota.terminada && newItems.every(i => i.terminado)) {
                await notasApi.patch(nota.id, { terminada: true });
                toast.success("¡Todos los productos terminados! Nota actualizada automáticamente.");
            }
            onUpdate();
        } catch {
            toast.error("Error al actualizar");
        }
    };

    const toggleEntregado = async (item: ItemNota) => {
        try {
            const newState = !item.entregado;
            await itemsApi.patch(item.id, { entregado: newState });

            const newItems = items.map(i => i.id === item.id ? { ...i, entregado: newState } : i);
            setItems(newItems);
            toast.success(newState ? "Producto marcado como entregado ✓" : "Entrega desmarcada");

            if (newState && !nota.entregada && newItems.every(i => i.entregado)) {
                await notasApi.patch(nota.id, { entregada: true });
                toast.success("¡Todos los productos entregados! Nota actualizada automáticamente.");
            }
            onUpdate();
        } catch {
            toast.error("Error al actualizar");
        }
    };

    const totalItems = items.length;
    const terminados = items.filter(i => i.terminado).length;
    const entregados = items.filter(i => i.entregado).length;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-[#ff7908] flex items-center gap-2">
                        <Package className="w-6 h-6" />
                        Productos — Nota #{nota.numeroNota}
                    </DialogTitle>
                    <p className="text-sm text-gray-500">{nota.clienteNombre}</p>
                </DialogHeader>

                {/* Progress bars */}
                <div className="space-y-3 mb-6">
                    <div>
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-blue-700 font-semibold">Progreso de Producción (Terminados)</span>
                            <span className="text-blue-700">{terminados}/{totalItems}</span>
                        </div>
                        <div className="w-full bg-blue-100 rounded-full h-2.5 overflow-hidden border border-blue-200">
                            <div
                                className="bg-blue-600 h-full transition-all duration-500 ease-out"
                                style={{ width: `${totalItems > 0 ? (terminados / totalItems) * 100 : 0}%` }}
                            />
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-green-700 font-semibold">Progreso de Entrega (Entregados)</span>
                            <span className="text-green-700">{entregados}/{totalItems}</span>
                        </div>
                        <div className="w-full bg-green-100 rounded-full h-2.5 overflow-hidden border border-green-200">
                            <div
                                className="bg-green-600 h-full transition-all duration-500 ease-out"
                                style={{ width: `${totalItems > 0 ? (entregados / totalItems) * 100 : 0}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Items list */}
                <div className="space-y-2">
                    {items.map((item, idx) => (
                        <div
                            key={item.id}
                            className={`
                flex items-center justify-between p-3 rounded-lg border transition-all
                ${item.entregado
                                    ? "bg-green-50 border-green-300"
                                    : item.terminado
                                        ? "bg-blue-50 border-blue-300"
                                        : "bg-white border-gray-200 hover:border-orange-300"
                                }
              `}
                        >
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-gray-400">#{idx + 1}</span>
                                    <span className={`font-medium ${item.entregado ? "line-through text-gray-400" : ""}`}>
                                        {item.descripcion || "Sin descripción"}
                                    </span>
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                    Cant: {item.cantidad} × ${item.precioUnitario.toFixed(2)} = <span className="font-semibold text-[#ff7908]">${item.importe.toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="flex gap-2 ml-4">
                                <Button
                                    size="sm"
                                    variant={item.terminado ? "default" : "outline"}
                                    className={item.terminado ? "bg-blue-600 hover:bg-blue-700 text-white text-xs" : "text-xs"}
                                    onClick={() => toggleTerminado(item)}
                                >
                                    <CheckCircle2 className="w-4 h-4 mr-1" />
                                    {item.terminado ? "Terminado" : "Terminar"}
                                </Button>
                                <Button
                                    size="sm"
                                    variant={item.entregado ? "default" : "outline"}
                                    className={item.entregado ? "bg-green-600 hover:bg-green-700 text-white text-xs" : "text-xs"}
                                    onClick={() => toggleEntregado(item)}
                                >
                                    <Truck className="w-4 h-4 mr-1" />
                                    {item.entregado ? "Entregado" : "Entregar"}
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}
