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
import { Checkbox } from "./ui/checkbox";
import { Textarea } from "./ui/textarea";
import { Nota, Abono } from "../types/nota";
import { Trash2, Plus, DollarSign } from "lucide-react";
import { generateId } from "../utils/api";

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
  const [esTarjeta, setEsTarjeta] = useState(false);
  const [esTransferencia, setEsTransferencia] = useState(false);

  const totalAbonado = abonos.reduce((sum, abono) => sum + abono.monto, 0);
  const saldoPendiente = nota.total - totalAbonado;

  const agregarAbono = () => {
    const monto = parseFloat(nuevoMonto);
    if (isNaN(monto) || monto <= 0) {
      alert("Por favor ingresa un monto válido");
      return;
    }

    const tag = esTarjeta ? "💳 Tarjeta" : esTransferencia ? "📲 Transferencia" : "";
    const prefix = tag + (tag && nuevaNota ? " - " : "");
    const finalNotaText = prefix + (nuevaNota || "");

    const nuevoAbono: Abono = {
      id: generateId(),
      fecha: new Date().toISOString(),
      monto,
      nota: finalNotaText || undefined,
    };

    setAbonos([...abonos, nuevoAbono]);
    setNuevoMonto("");
    setNuevaNota("");
    setEsTarjeta(false);
    setEsTransferencia(false);
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
      <DialogContent className="max-w-2xl max-h-[95vh] flex flex-col p-0 overflow-hidden border-orange-200">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-2xl font-black text-slate-800 flex items-center gap-2 uppercase tracking-tight">
            <DollarSign className="w-6 h-6 text-[#ff7908]" />
            Abonos — Nota #{nota.numeroNota}
          </DialogTitle>
          <DialogDescription className="font-medium">
            Cliente: <span className="text-slate-700 uppercase">{nota.clienteNombre}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-2 space-y-6">
          {/* Resumen Compacto */}
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl border border-orange-100 p-4 shadow-sm">
            <div className="grid grid-cols-3 divide-x divide-orange-200 text-center">
              <div>
                <p className="text-[10px] font-bold text-orange-400 uppercase tracking-widest">Total</p>
                <p className="text-lg font-black text-slate-400 line-through">${nota.total.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Abonado</p>
                <p className="text-xl font-black text-emerald-600">${totalAbonado.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Saldo</p>
                <p className="text-2xl font-black text-red-600">${saldoPendiente.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Agregar nuevo abono */}
          <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl shadow-inner">
            <h4 className="font-black text-slate-800 mb-3 uppercase text-xs tracking-tighter flex items-center gap-2">
              <Plus className="w-4 h-4 text-orange-500" />
              Nuevo Abono
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-500">Monto del Pago ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={nuevoMonto}
                  onChange={(e) => setNuevoMonto(e.target.value)}
                  placeholder="0.00"
                  className="bg-white border-slate-200 h-10 text-lg font-black text-slate-800 focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-500">Referencia (Opcional)</Label>
                <Input
                  type="text"
                  value={nuevaNota}
                  onChange={(e) => setNuevaNota(e.target.value)}
                  placeholder="Ej: Anticipo, Depósito..."
                  className="bg-white border-slate-200 h-10 text-slate-700"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-4 mt-4">
              <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm cursor-pointer hover:bg-orange-50 transition-colors">
                <Checkbox
                  id="es-tarjeta"
                  checked={esTarjeta}
                  onCheckedChange={(checked) => {
                    setEsTarjeta(checked as boolean);
                    if (checked) setEsTransferencia(false);
                  }}
                  className="border-orange-500 text-orange-600 focus:ring-orange-500"
                />
                <Label htmlFor="es-tarjeta" className="text-xs font-bold text-slate-600 cursor-pointer select-none">
                  Tarjeta 💳
                </Label>
              </div>

              <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm cursor-pointer hover:bg-orange-50 transition-colors">
                <Checkbox
                  id="es-transferencia"
                  checked={esTransferencia}
                  onCheckedChange={(checked) => {
                    setEsTransferencia(checked as boolean);
                    if (checked) setEsTarjeta(false);
                  }}
                  className="border-orange-500 text-orange-600 focus:ring-orange-500"
                />
                <Label htmlFor="es-transferencia" className="text-xs font-bold text-slate-600 cursor-pointer select-none">
                  Transferencia 📲
                </Label>
              </div>
            </div>

            <Button
              onClick={agregarAbono}
              className="mt-5 w-full bg-[#ff7908] hover:bg-[#e66d07] text-white font-bold h-11 shadow-lg shadow-orange-100"
            >
              <Plus className="w-5 h-5 mr-2 stroke-[3px]" />
              Registrar este Pago
            </Button>
          </div>

          {/* Lista de abonos */}
          <div className="pb-4">
            <h4 className="font-black text-slate-800 mb-3 uppercase text-xs tracking-tighter">Historial de Pagos</h4>
            {abonos.length === 0 ? (
              <div className="text-center py-10 bg-white border-2 border-dashed border-slate-200 rounded-2xl">
                <p className="text-slate-400 font-medium">No se han registrado pagos aún</p>
              </div>
            ) : (
              <div className="space-y-3">
                {[...abonos].reverse().map((abono) => (
                  <div
                    key={abono.id}
                    className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl hover:border-orange-300 transition-all hover:shadow-md group"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-black text-xl text-slate-800">${abono.monto.toFixed(2)}</p>
                        {abono.nota?.includes('Liquidación') && (
                          <span className="text-[10px] font-black bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full uppercase">Automatizado</span>
                        )}
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">{formatearFecha(abono.fecha)}</p>
                      {abono.nota && (
                        <p className="text-sm font-semibold text-slate-500 mt-1">{abono.nota}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => eliminarAbono(abono.id)}
                      className="text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl"
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="p-6 bg-slate-50 border-t border-slate-200">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="font-bold text-slate-500">
            Cancelar
          </Button>
          <Button onClick={handleSave} className="bg-slate-900 hover:bg-slate-800 text-white font-black px-8">
            Guardar Cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog >
  );
}
