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
import { Checkbox } from "./ui/checkbox";
import { Nota } from "../types/nota";

interface EstadoNotaDialogProps {
  nota: Nota;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (updates: { terminada: boolean; pagada: boolean; entregada: boolean }) => void;
}

export function EstadoNotaDialog({ nota, open, onOpenChange, onUpdate }: EstadoNotaDialogProps) {
  const [terminada, setTerminada] = useState(nota.terminada);
  const [pagada, setPagada] = useState(nota.pagada);
  const [entregada, setEntregada] = useState(nota.entregada);

  const handleSave = () => {
    onUpdate({ terminada, pagada, entregada });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Actualizar Estado - Nota #{nota.numeroNota}</DialogTitle>
          <DialogDescription>
            Marca los estados completados para esta nota
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="terminada"
              checked={terminada}
              onCheckedChange={(checked) => setTerminada(checked as boolean)}
            />
            <Label htmlFor="terminada" className="cursor-pointer">
              <span className="font-semibold text-blue-700">Terminada</span> - El pedido ha sido completado por el diseñador
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="pagada"
              checked={pagada}
              onCheckedChange={(checked) => setPagada(checked as boolean)}
            />
            <Label htmlFor="pagada" className="cursor-pointer">
              <span className="font-semibold text-emerald-700">Pagada</span> - El cliente ha realizado el pago
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="entregada"
              checked={entregada}
              onCheckedChange={(checked) => setEntregada(checked as boolean)}
            />
            <Label htmlFor="entregada" className="cursor-pointer">
              <span className="font-semibold text-purple-700">Entregada</span> - El pedido ha sido entregado al cliente
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} className="bg-gradient-to-r from-[#ff7908] to-[#ffac08] hover:from-[#ffac08] hover:to-[#ffe843] text-white">
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}