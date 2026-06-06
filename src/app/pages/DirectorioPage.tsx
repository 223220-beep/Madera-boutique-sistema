import { useState, useEffect } from "react";
import { Link } from "react-router";
import { clientesApi, Cliente } from "../utils/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { NotaHeader } from "../components/NotaHeader";
import { Pencil, Trash2, Plus, Save, X, Search } from "lucide-react";
import { toast } from "sonner";

export function DirectorioPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [filteredClientes, setFilteredClientes] = useState<Cliente[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoTelefono, setNuevoTelefono] = useState("");
  
  const [editando, setEditando] = useState<Cliente | null>(null);

  useEffect(() => {
    cargarClientes();
  }, []);

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

  const agregarCliente = async () => {
    const nombre = nuevoNombre.trim();
    if (!nombre) {
      toast.error("El nombre es obligatorio");
      return;
    }
    try {
      await clientesApi.add({ nombre, telefono: nuevoTelefono.trim() });
      toast.success("Cliente agregado");
      setNuevoNombre("");
      setNuevoTelefono("");
      cargarClientes();
    } catch (err) {
      toast.error("Error al agregar cliente");
    }
  };

  const guardarEdicion = async () => {
    if (!editando) return;
    const nombre = editando.nombre.trim();
    if (!nombre) {
      toast.error("El nombre es obligatorio");
      return;
    }
    try {
      await clientesApi.update(editando.id, { nombre, telefono: editando.telefono });
      toast.success("Cliente actualizado");
      setEditando(null);
      cargarClientes();
    } catch (err) {
      toast.error("Error al actualizar cliente");
    }
  };

  const eliminarCliente = async (id: string, nombre: string) => {
    if (!window.confirm(`¿Seguro que quieres eliminar a ${nombre}?`)) return;
    try {
      await clientesApi.delete(id);
      toast.success("Cliente eliminado");
      cargarClientes();
    } catch (err) {
      toast.error("Error al eliminar cliente");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <NotaHeader showFullHeader={false} />
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-[#ff7908]">Directorio de Clientes</h2>
            <Link to="/">
              <Button variant="outline">Volver al Inicio</Button>
            </Link>
          </div>

          <div className="bg-gradient-to-r from-orange-50 to-yellow-50 p-4 rounded-lg border border-orange-200 mb-6">
            <h3 className="text-[#ff7908] font-semibold mb-3">Agregar Nuevo Cliente</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end">
              <div className="md:col-span-2">
                <Label>Nombre</Label>
                <Input 
                  value={nuevoNombre} 
                  onChange={e => setNuevoNombre(e.target.value)} 
                  placeholder="Ej. Juan Pérez" 
                  className="bg-white"
                />
              </div>
              <div className="md:col-span-2">
                <Label>Teléfono</Label>
                <Input 
                  value={nuevoTelefono} 
                  onChange={e => setNuevoTelefono(e.target.value)} 
                  placeholder="Ej. 5551234567" 
                  className="bg-white"
                />
              </div>
              <div className="md:col-span-1">
                <Button onClick={agregarCliente} className="w-full bg-[#ff7908] hover:bg-[#ffac08] text-white">
                  <Plus className="w-4 h-4 mr-2" /> Agregar
                </Button>
              </div>
            </div>
          </div>

          <div className="mb-4 relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar cliente por nombre o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11"
            />
          </div>

          <div className="border border-[#ff7908] rounded-lg overflow-hidden">
            <div className="bg-[#ff7908] text-white grid grid-cols-12 gap-2 p-3 font-bold">
              <div className="col-span-5">NOMBRE</div>
              <div className="col-span-4">TELÉFONO</div>
              <div className="col-span-3 text-center">ACCIONES</div>
            </div>

            <div className="divide-y divide-[#ffac08] max-h-[500px] overflow-y-auto">
              {filteredClientes.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No se encontraron clientes</div>
              ) : (
                filteredClientes.map((cliente) => (
                  <div key={cliente.id} className="grid grid-cols-12 gap-2 p-3 items-center hover:bg-[#fffbc0]">
                    {editando?.id === cliente.id ? (
                      <>
                        <div className="col-span-5">
                          <Input 
                            value={editando.nombre} 
                            onChange={e => setEditando({...editando, nombre: e.target.value})} 
                            autoFocus
                          />
                        </div>
                        <div className="col-span-4">
                          <Input 
                            value={editando.telefono} 
                            onChange={e => setEditando({...editando, telefono: e.target.value})} 
                          />
                        </div>
                        <div className="col-span-3 flex justify-center gap-2">
                          <Button size="sm" onClick={guardarEdicion} className="bg-green-600 hover:bg-green-700 text-white">
                            <Save className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditando(null)}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="col-span-5 font-medium">{cliente.nombre}</div>
                        <div className="col-span-4 text-gray-600">{cliente.telefono || "-"}</div>
                        <div className="col-span-3 flex justify-center gap-2">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => setEditando(cliente)}
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => eliminarCliente(cliente.id, cliente.nombre)}
                            className="text-red-600 hover:text-red-800 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
