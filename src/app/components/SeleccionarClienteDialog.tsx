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
import { clientesApi, Cliente } from "../utils/api";
import { Search } from "lucide-react";
import { toast } from "sonner";

interface SeleccionarClienteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (cliente: Cliente) => void;
}

export function SeleccionarClienteDialog({ open, onOpenChange, onSelect }: SeleccionarClienteDialogProps) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [filteredClientes, setFilteredClientes] = useState<Cliente[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (open) {
      cargarClientes();
      setSearchTerm("");
    }
  }, [open]);

  useEffect(() => {
    if (!searchTerm) {
      setFilteredClientes(clientes);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredClientes(
        clientes.filter(c => 
          c.nombre.toLowerCase().includes(term) || 
          (c.telefono && c.telefono.includes(term))
        )
      );
    }
  }, [searchTerm, clientes]);

  const cargarClientes = async () => {
    try {
      const data = await clientesApi.getAll();
      setClientes(data);
    } catch (err) {
      toast.error("Error al cargar clientes");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Seleccionar Cliente</DialogTitle>
          <DialogDescription>
            Busca y selecciona un cliente del directorio
          </DialogDescription>
        </DialogHeader>

        <div className="relative mt-4">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar por nombre o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            autoFocus
          />
        </div>

        <div className="mt-4 flex-1 overflow-y-auto pr-2 border rounded-md">
          {filteredClientes.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              {searchTerm ? "No se encontraron resultados" : "No hay clientes en el directorio"}
            </div>
          ) : (
            <div className="divide-y">
              {filteredClientes.map((cliente) => (
                <div 
                  key={cliente.id} 
                  className="p-3 hover:bg-orange-50 cursor-pointer flex justify-between items-center transition-colors"
                  onClick={() => {
                    onSelect(cliente);
                    onOpenChange(false);
                  }}
                >
                  <div>
                    <div className="font-medium text-gray-900">{cliente.nombre}</div>
                    {cliente.telefono && (
                      <div className="text-sm text-gray-500">{cliente.telefono}</div>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" className="text-orange-600 hover:text-orange-800 hover:bg-orange-100">
                    Seleccionar
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
