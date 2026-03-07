import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { disenadoresApi } from "../utils/api";
import { Pencil, Trash2, Plus, Save, X } from "lucide-react";
import { toast } from "sonner";

interface GestionDisenadoresDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export function GestionDisenadoresDialog({ open, onOpenChange, onUpdate }: GestionDisenadoresDialogProps) {
  const [disenadores, setDisenadores] = useState<string[]>([]);
  const [nuevoDisenador, setNuevoDisenador] = useState("");
  const [editando, setEditando] = useState<{ index: number; nombre: string } | null>(null);

  useEffect(() => {
    if (open) {
      cargarDisenadores();
    }
  }, [open]);

  const cargarDisenadores = async () => {
    try {
      const d = await disenadoresApi.getAll();
      setDisenadores(d);
    } catch (err) {
      toast.error("Error al cargar diseñadores");
    }
  };

  const agregarDisenador = async () => {
    const nombre = nuevoDisenador.trim();
    if (!nombre) {
      toast.error("El nombre no puede estar vacío");
      return;
    }

    try {
      await disenadoresApi.add(nombre);
      toast.success(`Diseñador "${nombre}" agregado`);
      setNuevoDisenador("");
      cargarDisenadores();
      onUpdate();
    } catch (err) {
      toast.error("Este diseñador ya existe");
    }
  };

  const eliminarDisenador = async (nombre: string) => {
    if (disenadores.length <= 1) {
      toast.error("Debe haber al menos un diseñador");
      return;
    }

    try {
      await disenadoresApi.delete(nombre);
      toast.success(`Diseñador "${nombre}" eliminado`);
      cargarDisenadores();
      onUpdate();
    } catch (err) {
      toast.error("Error al eliminar diseñador");
    }
  };

  const iniciarEdicion = (index: number, nombre: string) => {
    setEditando({ index, nombre });
  };

  const guardarEdicion = async () => {
    if (!editando) return;

    const nuevoNombre = editando.nombre.trim();
    if (!nuevoNombre) {
      toast.error("El nombre no puede estar vacío");
      return;
    }

    const nombreAnterior = disenadores[editando.index];
    try {
      await disenadoresApi.update(nombreAnterior, nuevoNombre);
      toast.success("Diseñador actualizado");
      setEditando(null);
      cargarDisenadores();
      onUpdate();
    } catch (err) {
      toast.error("Error al actualizar diseñador");
    }
  };

  const cancelarEdicion = () => {
    setEditando(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Gestión de Diseñadores</DialogTitle>
          <DialogDescription>
            Agrega, edita o elimina diseñadores
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Agregar nuevo diseñador */}
          <div className="bg-gradient-to-r from-orange-50 to-yellow-50 p-4 rounded-lg border border-orange-200">
            <Label className="text-orange-800 font-semibold">Agregar Nuevo Diseñador</Label>
            <div className="flex gap-2 mt-2">
              <Input
                value={nuevoDisenador}
                onChange={(e) => setNuevoDisenador(e.target.value)}
                placeholder="Nombre del diseñador"
                onKeyPress={(e) => e.key === "Enter" && agregarDisenador()}
              />
              <Button
                onClick={agregarDisenador}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Lista de diseñadores */}
          <div>
            <Label className="text-orange-800 font-semibold">Diseñadores Actuales</Label>
            <div className="space-y-2 mt-2 max-h-80 overflow-y-auto">
              {disenadores.map((disenador, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-3 bg-white border border-orange-200 rounded-lg hover:shadow-md transition-shadow"
                >
                  {editando?.index === index ? (
                    <>
                      <Input
                        value={editando.nombre}
                        onChange={(e) => setEditando({ ...editando, nombre: e.target.value })}
                        className="flex-1"
                        autoFocus
                        onKeyPress={(e) => e.key === "Enter" && guardarEdicion()}
                      />
                      <Button
                        size="sm"
                        onClick={guardarEdicion}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Save className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={cancelarEdicion}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 font-medium text-orange-800">{disenador}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => iniciarEdicion(index, disenador)}
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => eliminarDisenador(disenador)}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                        disabled={disenadores.length <= 1}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
