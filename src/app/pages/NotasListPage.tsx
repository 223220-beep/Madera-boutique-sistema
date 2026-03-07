import { useState, useEffect } from "react";
import { Link } from "react-router";
import { notasApi } from "../utils/api";
import { useSocket } from "../utils/socket";
import { Nota } from "../types/nota";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { NotaHeader } from "../components/NotaHeader";
import { NotaStatusBadges } from "../components/NotaStatusBadges";
import { EstadoNotaDialog } from "../components/EstadoNotaDialog";
import { AbonosDialog } from "../components/AbonosDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
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
import { Plus, Eye, Pencil, Trash2, Search, ListChecks, Users, DollarSign } from "lucide-react";
import { toast } from "sonner";

export function NotasListPage() {
  const [notas, setNotas] = useState<Nota[]>([]);
  const [filteredNotas, setFilteredNotas] = useState<Nota[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [notaToDelete, setNotaToDelete] = useState<string | null>(null);
  const [notaToUpdateEstado, setNotaToUpdateEstado] = useState<Nota | null>(null);
  const [notaToUpdateAbonos, setNotaToUpdateAbonos] = useState<Nota | null>(null);
  const { onNotaCreated, onNotaUpdated } = useSocket();

  useEffect(() => {
    cargarNotas();
  }, []);

  // Escuchar eventos en tiempo real
  useEffect(() => {
    const unsub1 = onNotaCreated(() => cargarNotas());
    const unsub2 = onNotaUpdated(() => cargarNotas());
    return () => { unsub1(); unsub2(); };
  }, [onNotaCreated, onNotaUpdated]);

  useEffect(() => {
    const filtered = notas.filter((nota) => {
      const search = searchTerm.toLowerCase();
      return (
        nota.numeroNota.toLowerCase().includes(search) ||
        nota.clienteNombre.toLowerCase().includes(search) ||
        nota.clienteTelefono.includes(search)
      );
    });
    setFilteredNotas(filtered);
  }, [searchTerm, notas]);

  const cargarNotas = async () => {
    try {
      const notasCargadas = await notasApi.getAll();
      setNotas(notasCargadas.sort((a: Nota, b: Nota) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));
    } catch (err) {
      toast.error("Error al cargar notas del servidor");
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await notasApi.patch(id, { eliminada: true });
      toast.success("Nota eliminada correctamente");
      cargarNotas();
    } catch (err) {
      toast.error("Error al eliminar la nota");
      console.error(err);
    }
    setNotaToDelete(null);
  };

  const handleUpdateEstado = async (updates: { terminada: boolean; pagada: boolean; entregada: boolean }) => {
    if (!notaToUpdateEstado) return;
    try {
      await notasApi.patch(notaToUpdateEstado.id, updates);
      toast.success("Estado actualizado correctamente");
      cargarNotas();
    } catch (err) {
      toast.error("Error al actualizar el estado");
      console.error(err);
    }
    setNotaToUpdateEstado(null);
  };

  const handleUpdateAbonos = async (abonos: any) => {
    if (!notaToUpdateAbonos) return;
    try {
      await notasApi.patch(notaToUpdateAbonos.id, { abonos });
      toast.success("Abonos actualizados correctamente");
      cargarNotas();
    } catch (err) {
      toast.error("Error al actualizar los abonos");
      console.error(err);
    }
    setNotaToUpdateAbonos(null);
  };

  const formatearFecha = (fechaISO: string) => {
    const date = new Date(fechaISO + "T00:00:00");
    return date.toLocaleDateString("es-MX", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <NotaHeader showFullHeader={true} />
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-[#ff7908]">Gestión de Notas</h2>
            <div className="flex gap-2">
              <Link to="/whatsapp">
                <Button variant="outline" className="border-green-500 text-green-700 hover:bg-green-50">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Pedido WhatsApp
                </Button>
              </Link>
              <Link to="/disenadores">
                <Button variant="outline" className="border-[#ff7908] text-[#ff7908]">
                  <Users className="w-4 h-4 mr-2" />
                  Diseñadores
                </Button>
              </Link>
              <Link to="/crear">
                <Button className="bg-[#ff7908] hover:bg-[#ffac08] text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Nota
                </Button>
              </Link>
            </div>
          </div>

          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar por número, cliente o teléfono..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {filteredNotas.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {searchTerm ? (
                <p>No se encontraron notas con el criterio de búsqueda</p>
              ) : (
                <div>
                  <p className="mb-4">No hay notas registradas</p>
                  <Link to="/crear">
                    <Button className="bg-gradient-to-r from-[#ff7908] to-[#ffac08] hover:from-[#ffac08] hover:to-[#ffe843] text-white">
                      Crear Primera Nota
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="border border-[#ff7908] rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#ff7908] hover:bg-[#ff7908]">
                    <TableHead className="text-white font-bold">N° Nota</TableHead>
                    <TableHead className="text-white font-bold">Fecha</TableHead>
                    <TableHead className="text-white font-bold">Cliente</TableHead>
                    <TableHead className="text-white font-bold">Teléfono</TableHead>
                    <TableHead className="text-white font-bold">Estados</TableHead>
                    <TableHead className="text-white font-bold text-right">Saldo</TableHead>
                    <TableHead className="text-white font-bold text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredNotas.map((nota) => (
                    <TableRow key={nota.id} className="hover:bg-[#fffb89]">
                      <TableCell className="font-semibold text-[#ff7908]">
                        {nota.numeroNota}
                      </TableCell>
                      <TableCell>{formatearFecha(nota.fecha)}</TableCell>
                      <TableCell>{nota.clienteNombre}</TableCell>
                      <TableCell>{nota.clienteTelefono}</TableCell>
                      <TableCell>
                        <NotaStatusBadges
                          terminada={nota.terminada}
                          pagada={nota.pagada}
                          entregada={nota.entregada}
                          viaWhatsapp={nota.viaWhatsapp}
                          size="sm"
                        />
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        <div className="flex flex-col items-end">
                          {nota.abonos && Array.isArray(nota.abonos) && nota.abonos.length > 0 ? (
                            <>
                              <span className="text-xs text-gray-400 line-through">
                                ${typeof nota.total === 'number' ? nota.total.toFixed(2) : '0.00'}
                              </span>
                              <span className="text-red-600">
                                ${((nota.total || 0) - (nota.abonos.reduce((s, a) => s + (a.monto || 0), 0))).toFixed(2)}
                              </span>
                            </>
                          ) : (
                            <span>${typeof nota.total === 'number' ? nota.total.toFixed(2) : '0.00'}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 justify-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setNotaToUpdateAbonos(nota)}
                            className="text-green-600 hover:text-green-800 hover:bg-green-50"
                            title="Gestionar abonos"
                          >
                            <DollarSign className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setNotaToUpdateEstado(nota)}
                            className="text-orange-600 hover:text-orange-800 hover:bg-orange-50"
                          >
                            <ListChecks className="w-4 h-4" />
                          </Button>
                          <Link to={`/ver/${nota.id}`}>
                            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800 hover:bg-blue-50">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Link to={`/editar/${nota.id}`}>
                            <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-800 hover:bg-green-50">
                              <Pencil className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setNotaToDelete(nota.id)}
                            className="text-red-600 hover:text-red-800 hover:bg-red-50"
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

          <div className="mt-4 text-sm text-gray-600">
            Total de notas: {filteredNotas.length}
          </div>
        </div>
      </div>

      {/* Diálogo de confirmación de eliminación */}
      <AlertDialog open={!!notaToDelete} onOpenChange={() => setNotaToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar nota?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La nota será eliminada permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => notaToDelete && handleDelete(notaToDelete)}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo de actualización de estado */}
      {notaToUpdateEstado && (
        <EstadoNotaDialog
          nota={notaToUpdateEstado}
          open={!!notaToUpdateEstado}
          onOpenChange={(open) => !open && setNotaToUpdateEstado(null)}
          onUpdate={handleUpdateEstado}
        />
      )}

      {/* Diálogo de abonos */}
      {notaToUpdateAbonos && (
        <AbonosDialog
          nota={notaToUpdateAbonos}
          open={!!notaToUpdateAbonos}
          onOpenChange={(open) => !open && setNotaToUpdateAbonos(null)}
          onUpdate={handleUpdateAbonos}
        />
      )}
    </div>
  );
}