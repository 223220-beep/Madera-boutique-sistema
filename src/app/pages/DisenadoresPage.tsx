import { useState, useEffect } from "react";
import { Link } from "react-router";
import { notasApi, disenadoresApi } from "../utils/api";
import { useSocket } from "../utils/socket";
import { Nota } from "../types/nota";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { NotaHeader } from "../components/NotaHeader";
import { NotaStatusBadges } from "../components/NotaStatusBadges";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import { CheckCircle2, Eye, Flame, UserMinus, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Settings } from "lucide-react";
import { GestionDisenadoresDialog } from "../components/GestionDisenadoresDialog";

export function DisenadoresPage() {
  const [notas, setNotas] = useState<Nota[]>([]);
  const [notasPendientes, setNotasPendientes] = useState<Nota[]>([]);
  const [notasEnProceso, setNotasEnProceso] = useState<Nota[]>([]);
  const [notasTerminadas, setNotasTerminadas] = useState<Nota[]>([]);
  const [selectedDisenador, setSelectedDisenador] = useState<string>("");
  const [disenadores, setDisenadores] = useState<string[]>([]);
  const [showGestionDialog, setShowGestionDialog] = useState(false);
  const { onNotaCreated, onNotaUpdated, onDisenadoresUpdated } = useSocket();

  useEffect(() => {
    cargarNotas();
    cargarDisenadores();
  }, []);

  // Escuchar eventos en tiempo real
  useEffect(() => {
    const unsub1 = onNotaCreated(() => cargarNotas());
    const unsub2 = onNotaUpdated(() => cargarNotas());
    const unsub3 = onDisenadoresUpdated((nuevosDisenadores) => setDisenadores(nuevosDisenadores));
    return () => { unsub1(); unsub2(); unsub3(); };
  }, [onNotaCreated, onNotaUpdated, onDisenadoresUpdated]);

  useEffect(() => {
    filtrarNotas();
  }, [notas, selectedDisenador]);

  const cargarNotas = async () => {
    try {
      const notasCargadas = await notasApi.getAll();
      setNotas(notasCargadas);
    } catch (err) {
      toast.error("Error al cargar notas");
      console.error(err);
    }
  };

  const cargarDisenadores = async () => {
    try {
      const d = await disenadoresApi.getAll();
      setDisenadores(d);
    } catch (err) {
      toast.error("Error al cargar diseñadores");
      console.error(err);
    }
  };

  const filtrarNotas = () => {
    let notasFiltradas = notas;

    if (selectedDisenador) {
      notasFiltradas = notasFiltradas.filter((nota) => nota.asignadoA && nota.asignadoA.includes(selectedDisenador));
    }

    // Notas pendientes SIEMPRE son las que no tienen asignación (ignorando el filtro de diseñador)
    setNotasPendientes(notas.filter((n) => !n.asignadoA || n.asignadoA.length === 0).sort((a, b) => (b.urgente ? 1 : 0) - (a.urgente ? 1 : 0)));

    // Las demás notas sí respetan el filtro
    setNotasEnProceso(notasFiltradas.filter((n) => n.asignadoA && n.asignadoA.length > 0 && !n.terminada).sort((a, b) => (b.urgente ? 1 : 0) - (a.urgente ? 1 : 0)));
    setNotasTerminadas(notasFiltradas.filter((n) => n.terminada));
  };

  const toggleUrgencia = async (notaId: string, actual: boolean) => {
    try {
      await notasApi.patch(notaId, { urgente: !actual });
      toast.success(actual ? "Se quitó la urgencia" : "¡Nota marcada como URGENTE!");
      cargarNotas();
    } catch (err) {
      toast.error("Error al cambiar urgencia");
    }
  };

  const desasignarDisenador = async (notaId: string) => {
    try {
      await notasApi.patch(notaId, { asignadoA: [] });
      toast.success("Nota devuelta a pendientes");
      cargarNotas();
    } catch (err) {
      toast.error("Error al desasignar");
    }
  };

  const asignarDisenador = async (nota: Nota, disenador: string) => {
    try {
      const actuales = nota.asignadoA || [];
      if (actuales.includes(disenador)) {
        toast.info(`${disenador} ya estaba asignado a esta nota`);
        return;
      }
      if (actuales.length >= 2) {
        toast.error("No puedes asignar más de 2 diseñadores");
        return;
      }
      const nuevaLista = [...actuales, disenador];
      await notasApi.patch(nota.id, { asignadoA: nuevaLista });
      toast.success(`Nota asignada a ${nuevaLista.join(' y ')}`);
      cargarNotas();
    } catch (err) {
      toast.error("Error al asignar diseñador");
      console.error(err);
    }
  };

  const marcarComoTerminada = async (notaId: string) => {
    try {
      await notasApi.patch(notaId, { terminada: true });
      toast.success("Nota marcada como terminada");
      cargarNotas();
    } catch (err) {
      toast.error("Error al actualizar nota");
      console.error(err);
    }
  };

  const formatearFecha = (fechaISO: string) => {
    const date = new Date(fechaISO + "T00:00:00");
    return date.toLocaleDateString("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getNotasPorDisenador = () => {
    const stats: { [key: string]: { total: number; enProceso: number; terminadas: number } } = {};

    disenadores.forEach((disenador) => {
      const notasDisenador = notas.filter((n) => n.asignadoA && n.asignadoA.includes(disenador));
      stats[disenador] = {
        total: notasDisenador.length,
        enProceso: notasDisenador.filter((n) => !n.terminada).length,
        terminadas: notasDisenador.filter((n) => n.terminada).length,
      };
    });

    return stats;
  };

  const NotaCard = ({ nota, showAssign = false }: { nota: Nota; showAssign?: boolean }) => (
    <Card className={`hover:shadow-lg transition-shadow relative ${nota.urgente ? 'border-red-500 shadow-red-100 bg-red-50' : ''}`}>
      {nota.urgente && (
        <div className="absolute -top-3 -right-3 bg-red-600 text-white p-1.5 rounded-full shadow-lg">
          <Flame className="w-5 h-5 animate-pulse" />
        </div>
      )}
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className={`text-lg ${nota.urgente ? 'text-red-700 font-extrabold' : 'text-orange-600'}`}>Nota #{nota.numeroNota}</CardTitle>
            <CardDescription>{nota.clienteNombre}</CardDescription>
          </div>
          {nota.asignadoA && nota.asignadoA.length > 0 && (
            <div className="flex flex-col gap-1 items-end">
              {nota.asignadoA.map((d) => (
                <Badge key={d} variant="outline" className={`text-white ${nota.urgente ? 'bg-red-600 border-red-700' : 'bg-orange-600'}`}>
                  {d}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm">
          <p className="text-gray-600">Fecha: {formatearFecha(nota.fecha)}</p>
          <p className="text-gray-600">Items: {nota.items.length}</p>
          <p className="font-semibold text-orange-700">Total: ${nota.total.toFixed(2)}</p>
        </div>

        <NotaStatusBadges
          terminada={nota.terminada}
          pagada={nota.pagada}
          entregada={nota.entregada}
          viaWhatsapp={nota.viaWhatsapp}
          size="sm"
        />

        <div className="flex justify-between items-center mt-2">
          {!nota.terminada && (
            <Button
              variant={nota.urgente ? "destructive" : "outline"}
              size="sm"
              onClick={() => toggleUrgencia(nota.id, !!nota.urgente)}
              className="text-xs"
            >
              <Flame className="w-4 h-4 mr-1" />
              {nota.urgente ? 'Urgente' : 'Marcar Urgente'}
            </Button>
          )}

          {nota.asignadoA && nota.asignadoA.length > 0 && !nota.terminada && (
            <Button
              variant="destructive"
              size="sm"
              className="text-xs bg-red-100 text-red-700 hover:bg-red-200"
              onClick={() => desasignarDisenador(nota.id)}
            >
              <UserMinus className="w-4 h-4 mr-1" />
              Quitar
            </Button>
          )}
        </div>

        {((showAssign && (!nota.asignadoA || nota.asignadoA.length === 0)) || (!nota.terminada && nota.asignadoA && nota.asignadoA.length === 1)) && (
          <div className="space-y-2 mt-4 border-t pt-3">
            <Label className="text-xs text-gray-500">
              {!nota.asignadoA || nota.asignadoA.length === 0 ? "Asignar diseñador:" : "Agregar 2do diseñador:"}
            </Label>
            <Select onValueChange={(value) => asignarDisenador(nota, value)}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Seleccionar diseñador" />
              </SelectTrigger>
              <SelectContent>
                {disenadores.filter(d => !(nota.asignadoA || []).includes(d)).map((disenador) => (
                  <SelectItem key={disenador} value={disenador}>
                    {disenador}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex gap-2">
          <Link to={`/ver/${nota.id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              <Eye className="w-4 h-4 mr-1" />
              Ver
            </Button>
          </Link>
          {nota.asignadoA && nota.asignadoA.length > 0 && !nota.terminada && (
            <Button
              size="sm"
              onClick={() => marcarComoTerminada(nota.id)}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <CheckCircle2 className="w-4 h-4 mr-1" />
              Terminar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const stats = getNotasPorDisenador();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <NotaHeader showFullHeader={false} />
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-orange-600">Panel de Diseñadores</h2>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowGestionDialog(true)}
                variant="outline"
                className="border-orange-600 text-orange-600"
              >
                <Settings className="w-4 h-4 mr-2" />
                Gestionar Diseñadores
              </Button>
              <Link to="/">
                <Button variant="outline">Volver al Inicio</Button>
              </Link>
            </div>
          </div>

          {/* Estadísticas por diseñador */}
          <div className="mb-6 p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg border border-orange-200">
            <h3 className="font-semibold text-orange-700 mb-3">Estadísticas por Diseñador</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {disenadores.map((disenador) => (
                <div key={disenador} className="bg-white p-3 rounded-lg border border-orange-300">
                  <p className="font-semibold text-sm text-orange-700">{disenador}</p>
                  <div className="mt-2 space-y-1 text-xs">
                    <p>Total: {stats[disenador]?.total || 0}</p>
                    <p className="text-orange-600">En proceso: {stats[disenador]?.enProceso || 0}</p>
                    <p className="text-green-600">Terminadas: {stats[disenador]?.terminadas || 0}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Filtro por diseñador */}
          <div className="mb-6">
            <Label>Filtrar por diseñador:</Label>
            <Select value={selectedDisenador || "TODOS"} onValueChange={(value) => setSelectedDisenador(value === "TODOS" ? "" : value)}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Todos los diseñadores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos los diseñadores</SelectItem>
                {disenadores.map((disenador) => (
                  <SelectItem key={disenador} value={disenador}>
                    {disenador}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tabs de notas */}
          <Tabs defaultValue="pendientes" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pendientes">
                Pendientes ({notasPendientes.length})
              </TabsTrigger>
              <TabsTrigger value="proceso">
                En Proceso ({notasEnProceso.length})
              </TabsTrigger>
              <TabsTrigger value="terminadas">
                Terminadas ({notasTerminadas.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pendientes" className="mt-6">
              {notasPendientes.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No hay notas pendientes de asignar</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {notasPendientes.map((nota) => (
                    <NotaCard key={nota.id} nota={nota} showAssign={true} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="proceso" className="mt-6">
              {notasEnProceso.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No hay notas en proceso</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {notasEnProceso.map((nota) => (
                    <NotaCard key={nota.id} nota={nota} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="terminadas" className="mt-6">
              {notasTerminadas.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No hay notas terminadas</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {notasTerminadas.map((nota) => (
                    <NotaCard key={nota.id} nota={nota} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Diálogo de gestión de diseñadores */}
      <GestionDisenadoresDialog
        open={showGestionDialog}
        onOpenChange={setShowGestionDialog}
        onUpdate={() => {
          cargarDisenadores();
          cargarNotas();
        }}
      />
    </div>
  );
}