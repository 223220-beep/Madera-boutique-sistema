import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router";
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
import { Input } from "../components/ui/input";
import { Check, CheckCircle2, Eye, Flame, UserMinus, UserPlus, Settings, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { GestionDisenadoresDialog } from "../components/GestionDisenadoresDialog";

export function DisenadoresPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [notas, setNotas] = useState<Nota[]>([]);
  const [notasPendientes, setNotasPendientes] = useState<Nota[]>([]);
  const [notasEnProceso, setNotasEnProceso] = useState<Nota[]>([]);
  const [notasTerminadas, setNotasTerminadas] = useState<Nota[]>([]);

  // Inicializar filtros y tab desde la URL para restaurarlos al regresar
  const [selectedDisenador, setSelectedDisenador] = useState<string>(searchParams.get("disenador") || "");
  const [filterDateType, setFilterDateType] = useState<"creacion" | "entrega">((searchParams.get("tipoFecha") as "creacion" | "entrega") || "creacion");
  const [filterStartDate, setFilterStartDate] = useState<string>(searchParams.get("desde") || "");
  const [filterEndDate, setFilterEndDate] = useState<string>(searchParams.get("hasta") || "");
  const [activeTab, setActiveTab] = useState<string>(searchParams.get("tab") || "pendientes");

  const [disenadores, setDisenadores] = useState<string[]>([]);
  const [showGestionDialog, setShowGestionDialog] = useState(false);
  const { onNotaCreated, onNotaUpdated, onDisenadoresUpdated } = useSocket();

  // Sincronizar filtros y tab activo con la URL
  useEffect(() => {
    const params: Record<string, string> = {};
    if (activeTab && activeTab !== "pendientes") params.tab = activeTab;
    if (selectedDisenador) params.disenador = selectedDisenador;
    if (filterDateType && filterDateType !== "creacion") params.tipoFecha = filterDateType;
    if (filterStartDate) params.desde = filterStartDate;
    if (filterEndDate) params.hasta = filterEndDate;
    setSearchParams(params, { replace: true });
  }, [activeTab, selectedDisenador, filterDateType, filterStartDate, filterEndDate]);

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
  }, [notas, selectedDisenador, filterStartDate, filterEndDate, filterDateType]);

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

    if (filterStartDate) {
      notasFiltradas = notasFiltradas.filter(n => {
        const d = filterDateType === "creacion" ? n.fecha.substring(0, 10) : (n.fechaEntrega || "");
        return d && d >= filterStartDate;
      });
    }

    if (filterEndDate) {
      notasFiltradas = notasFiltradas.filter(n => {
        const d = filterDateType === "creacion" ? n.fecha.substring(0, 10) : (n.fechaEntrega || "");
        return d && d <= filterEndDate;
      });
    }

    const sortFunction = (a: Nota, b: Nota) => {
      // 1. Prioridad Máxima: Urgente
      if (a.urgente !== b.urgente) return b.urgente ? 1 : -1;

      // 2. Prioridad Secundaria: Fecha de entrega más cercana primero
      const dateA = a.fechaEntrega || "9999-12-31";
      const dateB = b.fechaEntrega || "9999-12-31";
      if (dateA !== dateB) return dateA < dateB ? -1 : 1;

      // 3. Fallback: Fecha de creación (más antiguo primero)
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    };

    // Notas pendientes SIEMPRE son las que no tienen asignación (ignorando el filtro de diseñador)
    setNotasPendientes(notas.filter((n) => (!n.asignadoA || n.asignadoA.length === 0) && !n.terminada).sort(sortFunction));

    // Las demás notas sí respetan el filtro
    setNotasEnProceso(notasFiltradas.filter((n) => n.asignadoA && n.asignadoA.length > 0 && !n.terminada).sort(sortFunction));
    setNotasTerminadas(notasFiltradas.filter((n) => n.terminada && n.asignadoA && n.asignadoA.length > 0));
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
      await notasApi.patch(notaId, { asignadoA: [], disenadoresTerminados: [] });
      toast.success("Nota quitada de la vista de diseñadores");
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

  const toggleDesignerTermino = async (nota: Nota, disenador: string) => {
    const actuales = nota.disenadoresTerminados || [];
    const terminados = actuales.includes(disenador)
      ? actuales.filter(d => d !== disenador)
      : [...actuales, disenador];

    try {
      await notasApi.patch(nota.id, { disenadoresTerminados: terminados });
      toast.success(actuales.includes(disenador) ? "Progreso revertido" : "¡Parte del diseño marcada como lista!");
      cargarNotas();
    } catch {
      toast.error("Error al actualizar progreso");
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
    if (!fechaISO) return "Sin fecha";
    const date = new Date(fechaISO + "T00:00:00");
    if (isNaN(date.getTime())) return "Sin fecha";
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
              {nota.asignadoA.map((d) => {
                const finished = (nota.disenadoresTerminados || []).includes(d);
                return (
                  <div key={d} className="flex items-center gap-1 justify-end">
                    <button
                      onClick={() => toggleDesignerTermino(nota, d)}
                      className={`rounded-full p-0.5 border ${finished ? 'bg-green-500 border-green-600 text-white' : 'border-gray-300 text-transparent hover:border-orange-400'}`}
                      title={finished ? "Marcar como no terminado" : "Marcar mi parte como lista"}
                    >
                      <Check className="w-3 h-3" strokeWidth={3} />
                    </button>
                    <Badge variant="outline" className={`text-white ${finished ? 'bg-green-600 border-green-700' : nota.urgente ? 'bg-red-600 border-red-700' : 'bg-orange-600'}`}>
                      {d}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm flex justify-between">
          <div>
            <p className="text-gray-600">Fecha: {formatearFecha(nota.fecha)}</p>
            <p className="text-gray-600">Objetos: {nota.items.filter(i => i.terminado).length} / {nota.items.length} hechos</p>
            <p className="font-semibold text-orange-700">Total: ${nota.total.toFixed(2)}</p>
          </div>
          {nota.fechaEntrega && (
            <div className="text-right">
              <p className="text-xs text-gray-400">Entrega:</p>
              <p className="font-bold text-purple-700">{formatearFecha(nota.fechaEntrega)}</p>
            </div>
          )}
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

          {nota.asignadoA && nota.asignadoA.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              className="text-xs bg-red-100 text-red-700 hover:bg-red-200"
              onClick={() => desasignarDisenador(nota.id)}
              title="Quitar de mi vista de Diseñador"
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

          {/* Filtros */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4 bg-orange-50 p-4 rounded-lg border border-orange-200">
            <div>
              <Label>Filtrar por diseñador:</Label>
              <Select value={selectedDisenador || "TODOS"} onValueChange={(value) => setSelectedDisenador(value === "TODOS" ? "" : value)}>
                <SelectTrigger className="mt-1 bg-white">
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
            <div>
              <Label>Tipo de Fecha:</Label>
              <Select value={filterDateType} onValueChange={(v: "creacion" | "entrega") => setFilterDateType(v)}>
                <SelectTrigger className="mt-1 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="creacion">Día de Creación</SelectItem>
                  <SelectItem value="entrega">Día de Entrega</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Desde:</Label>
              <Input type="date" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} className="mt-1 bg-white" />
            </div>
            <div>
              <Label>Hasta:</Label>
              <div className="flex gap-2 items-center mt-1">
                <Input type="date" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} className="bg-white" />
                {(filterStartDate || filterEndDate) && (
                  <Button variant="ghost" size="sm" onClick={() => { setFilterStartDate(""); setFilterEndDate(""); }} className="text-gray-500 px-2 border border-gray-300" title="Limpiar fechas">
                    ✕
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Tabs de notas */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
              <div className="flex justify-between items-end mb-4 border-b border-gray-200 pb-2">
                <p className="text-gray-500 text-sm">Estas notas ya fueron finalizadas. Quítalas de tu vista cuando termines.</p>
                {notasTerminadas.length > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      if (window.confirm("¿Estás seguro de limpiar toda la vista de notas terminadas?\\nEsto desasignará todas las notas en esta pestaña.\\n(Seguirán en la base de datos general)")) {
                        toast.promise(
                          Promise.all(notasTerminadas.map((n) => notasApi.patch(n.id, { asignadoA: [], disenadoresTerminados: [] }))),
                          {
                            loading: 'Limpiando panel de terminadas...',
                            success: () => {
                              cargarNotas();
                              return '¡Las notas han sido removidas de esta vista!';
                            },
                            error: 'Error al limpiar las notas',
                          }
                        );
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Limpiar todas
                  </Button>
                )}
              </div>
              {notasTerminadas.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No hay notas terminadas en tu lista</p>
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