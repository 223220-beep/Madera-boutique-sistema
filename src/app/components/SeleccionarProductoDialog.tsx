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
import { productosApi } from "../utils/api";
import { Producto } from "../types/producto";
import { Search, Package } from "lucide-react";
import { toast } from "sonner";

interface SeleccionarProductoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (producto: Producto) => void;
}

export function SeleccionarProductoDialog({
  open,
  onOpenChange,
  onSelect,
}: SeleccionarProductoDialogProps) {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [filteredProductos, setFilteredProductos] = useState<Producto[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (open) {
      cargarProductos();
      setSearchTerm("");
    }
  }, [open]);

  useEffect(() => {
    if (!searchTerm) {
      setFilteredProductos(productos);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredProductos(
        productos.filter(
          (p) =>
            p.nombre.toLowerCase().includes(term) ||
            p.codigo.toLowerCase().includes(term)
        )
      );
    }
  }, [searchTerm, productos]);

  const cargarProductos = async () => {
    try {
      const data = await productosApi.getAll();
      setProductos(data);
    } catch (err) {
      toast.error("Error al cargar productos");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] flex flex-col bg-white rounded-3xl border border-orange-100">
        <DialogHeader>
          <DialogTitle className="text-xl font-extrabold text-orange-600 uppercase tracking-tight flex items-center gap-2">
            <Package className="w-5 h-5" />
            Seleccionar Producto
          </DialogTitle>
          <DialogDescription className="text-gray-500">
            Busca y selecciona un producto del catálogo para agregarlo a la nota.
          </DialogDescription>
        </DialogHeader>

        <div className="relative mt-4">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar por código o nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border-orange-200 focus:border-orange-500 rounded-xl"
            autoFocus
          />
        </div>

        <div className="mt-4 flex-1 overflow-y-auto pr-2 border border-orange-100 rounded-xl divide-y divide-orange-50">
          {filteredProductos.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {searchTerm
                ? "No se encontraron productos coincidentes"
                : "No hay productos registrados en el catálogo"}
            </div>
          ) : (
            filteredProductos.map((p) => (
              <div
                key={p.id}
                className="p-3 hover:bg-orange-50/50 cursor-pointer flex justify-between items-center transition-colors rounded-lg group"
                onClick={() => {
                  onSelect(p);
                  onOpenChange(false);
                }}
              >
                <div className="space-y-0.5 flex-1 min-w-0 pr-4">
                  <div className="flex items-center gap-2">
                    {p.codigo && (
                      <span className="text-xs bg-orange-100 text-orange-800 font-bold px-2 py-0.5 rounded-full">
                        {p.codigo}
                      </span>
                    )}
                    <span className="font-bold text-gray-800 truncate block">
                      {p.nombre}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right flex flex-col justify-center">
                    <span className="text-xs text-gray-500 font-medium">Normal: ${p.precioNormal.toFixed(2)}</span>
                    <span className="font-bold text-orange-600 text-sm tracking-tight">Mayoreo: ${p.precioMayoreo.toFixed(2)}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-orange-600 hover:text-orange-850 hover:bg-orange-100 font-bold rounded-lg"
                  >
                    Seleccionar
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
