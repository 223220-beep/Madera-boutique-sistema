import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Nota, Abono } from "../types/nota";
import { Trash2, Plus } from "lucide-react";

interface AbonosDialogProps {
  nota: Nota;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (abonos: Abono[]) => void;
}

export function AbonosDialog({ nota, open, onOpenChange, onUpdate }: AbonosDialogProps) {
  const [abonos, setAbonos] = useState<Abono[]>(nota.abonos || []);
  const [nuevoMonto, setNuevoMonto] = useState("");
  const [nuevaNota, setNuevaNota] = useState("");

  const totalAbonado = abonos.reduce((sum, abono) => sum + abono.monto, 0);
  const saldoPendiente = nota.total - totalAbonado;

  const agregarAbono = () => {
    const monto = parseFloat(nuevoMonto);
    if (isNaN(monto) || monto <= 0) {
      alert("Por favor ingresa un monto válido");
      return;
    }

    const nuevoAbono: Abono = {
      id: crypto.randomUUID(),
      fecha: new Date().toISOString(),
      monto,
      nota: nuevaNota || undefined,
    };

    setAbonos([...abonos, nuevoAbono]);
    setNuevoMonto("");
    setNuevaNota("");
  };

  const eliminarAbono = (id: string) => {
    setAbonos(abonos.filter((a) => a.id !== id));
  };

  const handleSave = () => {
    onUpdate(abonos);
    onOpenChange(false);
  };

  const formatearFecha = (fechaISO: string) => {
    const date = new Date(fechaISO);
    return date.toLocaleDateString("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Gestión de Abonos - Nota #{nota.numeroNota}</DialogTitle>
          <DialogDescription>
            Registra los pagos parciales del cliente
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Resumen */}
          <div className="bg-gradient-to-r from-orange-50 to-yellow-50 p-4 rounded-lg border border-orange-200">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-600">Total Original</p>
                <p className="text-xl font-bold text-gray-500 line-through">${nota.total.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Abonado</p>
                <p className="text-xl font-bold text-green-600">-${totalAbonado.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-orange-800 font-bold">Saldo Actual</p>
                <p className="text-2xl font-bold text-red-600">${saldoPendiente.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Agregar nuevo abono */}
          <div className="border border-orange-200 p-4 rounded-lg bg-orange-50">
            <h4 className="font-semibold text-orange-800 mb-3">Agregar Nuevo Abono</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Monto</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={nuevoMonto}
                  onChange={(e) => setNuevoMonto(e.target.value)}
                  placeholder="0.00"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Nota (opcional)</Label>
                <Input
                  type="text"
                  value={nuevaNota}
                  onChange={(e) => setNuevaNota(e.target.value)}
                  placeholder="Ej: Anticipo, pago parcial..."
                  className="mt-1"
                />
              </div>
            </div>
            <Button
              onClick={agregarAbono}
              className="mt-3 w-full bg-orange-600 hover:bg-orange-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar Abono
            </Button>
          </div>

          {/* Lista de abonos */}
          {abonos.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2 text-orange-800">Historial de Abonos</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {abonos.map((abono) => (
                  <div
                    key={abono.id}
                    className="flex items-center justify-between p-3 bg-white border border-orange-200 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-orange-700">${abono.monto.toFixed(2)}</p>
                      <p className="text-xs text-gray-600">{formatearFecha(abono.fecha)}</p>
                      {abono.nota && (
                        <p className="text-sm text-gray-700 mt-1">{abono.nota}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => eliminarAbono(abono.id)}
                      className="text-red-600 hover:text-red-800 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} className="bg-orange-600 hover:bg-orange-700 text-white">
            Guardar Abonos
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
