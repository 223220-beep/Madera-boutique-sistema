import { useState, useEffect } from "react";
import { Link } from "react-router";
import { productosApi } from "../utils/api";
import { useSocket } from "../utils/socket";
import { Producto } from "../types/producto";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { NotaHeader } from "../components/NotaHeader";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Search, ArrowLeft, Package, Sparkles } from "lucide-react";
import { toast } from "sonner";

export function ProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredProductos, setFilteredProductos] = useState<Producto[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 30;

  // State for modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Producto | null>(null);

  // Form states
  const [codigo, setCodigo] = useState("");
  const [nombre, setNombre] = useState("");
  const [precioNormal, setPrecioNormal] = useState<number | "">("");
  const [precioMayoreo, setPrecioMayoreo] = useState<number | "">("");

  const { onProductosUpdated } = useSocket();

  useEffect(() => {
    cargarProductos();
  }, []);

  useEffect(() => {
    const unsubscribe = onProductosUpdated(() => {
      cargarProductos();
    });
    return unsubscribe;
  }, [onProductosUpdated]);

  useEffect(() => {
    const term = searchTerm.toLowerCase();
    setFilteredProductos(
      productos.filter(
        (p) =>
          p.nombre.toLowerCase().includes(term) ||
          p.codigo.toLowerCase().includes(term)
      )
    );
    setCurrentPage(1);
  }, [searchTerm, productos]);

  const cargarProductos = async () => {
    try {
      const data = await productosApi.getAll();
      setProductos(data);
    } catch (err) {
      toast.error("Error al cargar productos del servidor");
      console.error(err);
    }
  };

  const handleOpenAdd = () => {
    setCodigo("");
    setNombre("");
    setPrecioNormal("");
    setPrecioMayoreo("");
    setIsAddOpen(true);
  };

  const handleOpenEdit = (producto: Producto) => {
    setSelectedProduct(producto);
    setCodigo(producto.codigo);
    setNombre(producto.nombre);
    setPrecioNormal(producto.precioNormal);
    setPrecioMayoreo(producto.precioMayoreo);
    setIsEditOpen(true);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre) {
      toast.error("El nombre del producto es obligatorio");
      return;
    }
    try {
      await productosApi.add({
        codigo,
        nombre,
        precioNormal: Number(precioNormal) || 0,
        precioMayoreo: Number(precioMayoreo) || 0,
      });
      toast.success("Producto registrado exitosamente");
      setIsAddOpen(false);
      cargarProductos();
    } catch (err: any) {
      toast.error(err.message || "Error al registrar producto");
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    if (!nombre) {
      toast.error("El nombre del producto es obligatorio");
      return;
    }
    try {
      await productosApi.update(selectedProduct.id, {
        codigo,
        nombre,
        precioNormal: Number(precioNormal) || 0,
        precioMayoreo: Number(precioMayoreo) || 0,
      });
      toast.success("Producto actualizado exitosamente");
      setIsEditOpen(false);
      cargarProductos();
    } catch (err: any) {
      toast.error(err.message || "Error al actualizar producto");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await productosApi.delete(id);
      toast.success("Producto eliminado exitosamente");
      setProductToDelete(null);
      cargarProductos();
    } catch (err: any) {
      toast.error(err.message || "Error al eliminar producto");
    }
  };

  const totalPages = Math.ceil(filteredProductos.length / ITEMS_PER_PAGE);
  const paginatedProductos = filteredProductos.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <NotaHeader showFullHeader={false} />
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border border-orange-100">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full border-orange-300 text-[#ff7908] hover:bg-orange-50 hover:text-[#ffac08]"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="bg-orange-100 p-2 rounded-xl text-[#ff7908]">
                  <Package className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-3xl font-extrabold text-[#ff7908] uppercase tracking-tight flex items-center gap-2">
                    Catálogo de Productos
                    <Sparkles className="w-5 h-5 text-orange-400" />
                  </h2>
                  <p className="text-gray-500 text-sm">Gestiona tus productos, precio normal y precio de mayoreo</p>
                </div>
              </div>
            </div>

            <Button
              onClick={handleOpenAdd}
              className="bg-gradient-to-r from-[#ff7908] to-[#ffac08] hover:from-[#ffac08] hover:to-[#ffe843] text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all"
            >
              <Plus className="w-5 h-5 mr-2" />
              Nuevo Producto
            </Button>
          </div>

          {/* Search bar */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar por código o nombre del producto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 bg-gray-50/50 border-orange-200 focus:border-[#ff7908] focus:ring-1 focus:ring-[#ff7908] rounded-xl text-lg font-medium"
              />
            </div>
          </div>

          {/* Products table */}
          {filteredProductos.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-orange-100 rounded-2xl bg-orange-50/20">
              <Package className="w-16 h-16 text-orange-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-orange-800">No se encontraron productos</h3>
              <p className="text-gray-500 mt-1 max-w-sm mx-auto">
                {searchTerm
                  ? "Prueba con otra palabra clave en tu búsqueda."
                  : "Registra tu primer producto haciendo clic en 'Nuevo Producto'."}
              </p>
            </div>
          ) : (
            <div className="border border-orange-200 rounded-2xl overflow-hidden shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow className="bg-orange-500 hover:bg-orange-500">
                    <TableHead className="text-white font-extrabold text-base w-[180px]">Código</TableHead>
                    <TableHead className="text-white font-extrabold text-base">Nombre del Producto</TableHead>
                    <TableHead className="text-white font-extrabold text-base text-right pr-6 w-[160px]">P. Normal</TableHead>
                    <TableHead className="text-white font-extrabold text-base text-right pr-6 w-[160px]">P. Mayoreo</TableHead>
                    <TableHead className="text-white font-extrabold text-base text-center w-[150px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedProductos.map((p) => (
                    <TableRow key={p.id} className="hover:bg-orange-50/30 transition-colors border-orange-100">
                      <TableCell className="font-semibold text-orange-800 bg-orange-50/10">
                        {p.codigo || <span className="text-gray-300 italic font-normal">Sin código</span>}
                      </TableCell>
                      <TableCell className="font-bold text-gray-800 text-base">{p.nombre}</TableCell>
                      <TableCell className="text-right pr-6 font-semibold text-gray-700 text-base">
                        ${p.precioNormal.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right pr-6 font-black text-orange-700 text-lg tracking-tight">
                        ${p.precioMayoreo.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 justify-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(p)}
                            className="text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg"
                            title="Editar producto"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setProductToDelete(p.id)}
                            className="text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg"
                            title="Eliminar producto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-600">
              Mostrando {filteredProductos.length === 0 ? 0 : ((currentPage - 1) * ITEMS_PER_PAGE) + 1} a {Math.min(currentPage * ITEMS_PER_PAGE, filteredProductos.length)} de {filteredProductos.length} productos
            </div>

            {totalPages > 1 && (
              <div className="flex flex-wrap items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="rounded-xl border-orange-200 text-orange-950 font-bold"
                >
                  Anterior
                </Button>

                {/* Custom page buttons */}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => {
                  // Only show current, first, last, and immediate neighbors
                  if (
                    pageNum === 1 ||
                    pageNum === totalPages ||
                    (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                  ) {
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        className={currentPage === pageNum ? "bg-[#ff7908] hover:bg-[#ffac08] text-white rounded-xl font-bold" : "rounded-xl border-orange-200 text-orange-950 font-bold"}
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  } else if (
                    pageNum === currentPage - 2 ||
                    pageNum === currentPage + 2
                  ) {
                    return <span key={pageNum} className="px-2 text-gray-400">...</span>;
                  }
                  return null;
                })}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded-xl border-orange-200 text-orange-950 font-bold"
                >
                  Siguiente
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Product Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md bg-white rounded-3xl border border-orange-100">
          <form onSubmit={handleAdd} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black text-orange-600 uppercase tracking-tight">
                Registrar Producto
              </DialogTitle>
              <DialogDescription>
                Ingresa los detalles del producto para agregarlo al catálogo.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="add-codigo" className="text-orange-950 font-bold">Código (Opcional):</Label>
                <Input
                  id="add-codigo"
                  placeholder="Ej: LLA-01, MDF-3MM"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  className="border-orange-200 focus:border-orange-500 rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="add-nombre" className="text-orange-950 font-bold">Nombre del Producto:</Label>
                <Input
                  id="add-nombre"
                  placeholder="Ej: Llavero de acrílico personalizado"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="border-orange-200 focus:border-orange-500 rounded-xl"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="add-precio-normal" className="text-orange-950 font-bold">Precio Normal ($):</Label>
                  <Input
                    id="add-precio-normal"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={precioNormal}
                    onChange={(e) => setPrecioNormal(e.target.value === "" ? "" : Number(e.target.value))}
                    className="border-orange-200 focus:border-orange-500 rounded-xl"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="add-precio-mayoreo" className="text-orange-950 font-bold">Precio Mayoreo ($):</Label>
                  <Input
                    id="add-precio-mayoreo"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={precioMayoreo}
                    onChange={(e) => setPrecioMayoreo(e.target.value === "" ? "" : Number(e.target.value))}
                    className="border-orange-200 focus:border-orange-500 rounded-xl"
                    required
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="mt-6 flex gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsAddOpen(false)}
                className="rounded-xl font-bold"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-[#ff7908] hover:bg-[#ffac08] text-white font-bold rounded-xl px-6 shadow-md shadow-orange-100"
              >
                Guardar Producto
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md bg-white rounded-3xl border border-orange-100">
          <form onSubmit={handleEdit} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black text-orange-600 uppercase tracking-tight">
                Modificar Producto
              </DialogTitle>
              <DialogDescription>
                Edita los campos del producto seleccionado.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="edit-codigo" className="text-orange-950 font-bold">Código (Opcional):</Label>
                <Input
                  id="edit-codigo"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  className="border-orange-200 focus:border-orange-500 rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="edit-nombre" className="text-orange-950 font-bold">Nombre del Producto:</Label>
                <Input
                  id="edit-nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="border-orange-200 focus:border-orange-500 rounded-xl"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="edit-precio-normal" className="text-orange-950 font-bold">Precio Normal ($):</Label>
                  <Input
                    id="edit-precio-normal"
                    type="number"
                    step="0.01"
                    min="0"
                    value={precioNormal}
                    onChange={(e) => setPrecioNormal(e.target.value === "" ? "" : Number(e.target.value))}
                    className="border-orange-200 focus:border-orange-500 rounded-xl"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="edit-precio-mayoreo" className="text-orange-950 font-bold">Precio Mayoreo ($):</Label>
                  <Input
                    id="edit-precio-mayoreo"
                    type="number"
                    step="0.01"
                    min="0"
                    value={precioMayoreo}
                    onChange={(e) => setPrecioMayoreo(e.target.value === "" ? "" : Number(e.target.value))}
                    className="border-orange-200 focus:border-orange-500 rounded-xl"
                    required
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="mt-6 flex gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsEditOpen(false)}
                className="rounded-xl font-bold"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-[#ff7908] hover:bg-[#ffac08] text-white font-bold rounded-xl px-6 shadow-md shadow-orange-100"
              >
                Guardar Cambios
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={!!productToDelete} onOpenChange={() => setProductToDelete(null)}>
        <AlertDialogContent className="bg-white rounded-3xl border border-orange-100">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-orange-700 text-xl font-extrabold uppercase">
              ¿Eliminar Producto?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-500 text-base">
              ¿Estás seguro de que deseas eliminar este producto de la base de datos? Esta acción es irreversible y ya no podrás llamarlo desde las notas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl font-bold border-orange-200">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => productToDelete && handleDelete(productToDelete)}
              className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
