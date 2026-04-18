import { useState, useEffect } from "react";
import { Link } from "react-router";
import { cajaApi } from "../utils/api";
import { Button } from "../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { ArrowLeft, Wallet, Calendar, DollarSign, CreditCard, Send, Loader2 } from "lucide-react";
import { NotaHeader } from "../components/NotaHeader";
import { useSocket } from "../utils/socket";

export function CajaPage() {
    const [movimientos, setMovimientos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { onNotaCreated, onNotaUpdated } = useSocket();

    const cargarCaja = async () => {
        try {
            setLoading(true);
            const data = await cajaApi.getReport();
            setMovimientos(data);
        } catch (err) {
            console.error("Error al cargar caja:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarCaja();
        const cleanupCreated = onNotaCreated(cargarCaja);
        const cleanupUpdated = onNotaUpdated(cargarCaja);

        return () => {
            cleanupCreated();
            cleanupUpdated();
        };
    }, [onNotaCreated, onNotaUpdated]);

    // Agrupar por fecha (YYYY-MM-DD)
    const agrupadoPorFecha = movimientos.reduce((acc: any, curr: any) => {
        if (!curr.fecha) return acc;
        // Extraer solo la fecha YYYY-MM-DD
        const dateKey = curr.fecha.includes('T') ? curr.fecha.split('T')[0] : curr.fecha;
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(curr);
        return acc;
    }, {});

    const fechasOrdenadas = Object.keys(agrupadoPorFecha).sort((a, b) => b.localeCompare(a));

    const formatearFecha = (fechaStr: string) => {
        const date = new Date(fechaStr + "T12:00:00");
        return date.toLocaleDateString("es-MX", {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            <NotaHeader />

            <div className="max-w-6xl mx-auto px-4 mt-8">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link to="/">
                            <Button variant="outline" size="icon" className="rounded-full shadow-sm hover:bg-orange-50 hover:border-orange-200">
                                <ArrowLeft className="w-5 h-5 text-slate-600" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-4xl font-black text-slate-900 flex items-center gap-3 uppercase tracking-tighter">
                                <div className="bg-[#ff7908] p-2 rounded-xl shadow-orange-200 shadow-lg">
                                    <Wallet className="w-8 h-8 text-white" />
                                </div>
                                Control de Caja
                            </h1>
                            <p className="text-slate-500 font-medium ml-1">Flujo diario de ingresos y abonos</p>
                        </div>
                    </div>

                    <Button
                        onClick={cargarCaja}
                        variant="outline"
                        disabled={loading}
                        className="rounded-xl border-slate-200 font-bold text-slate-600 hover:bg-white hover:text-[#ff7908] hover:border-orange-200 shadow-sm"
                    >
                        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Loader2 className="w-4 h-4 mr-2" />}
                        Actualizar Caja
                    </Button>
                </div>

                {loading && movimientos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 text-slate-400">
                        <Loader2 className="w-12 h-12 animate-spin mb-4 text-orange-400" />
                        <p className="font-medium animate-pulse">Cargando movimientos financieros...</p>
                    </div>
                ) : fechasOrdenadas.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200 shadow-inner">
                        <div className="bg-slate-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Wallet className="w-12 h-12 text-slate-200" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-400">Aún no hay registros de dinero</h3>
                        <p className="text-slate-400 mt-1 max-w-xs mx-auto">
                            Los abonos y pagos que registres en las notas aparecerán automáticamente aquí.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-12">
                        {fechasOrdenadas.map(fecha => {
                            const entries = agrupadoPorFecha[fecha];
                            const totalDia = entries.reduce((s: number, e: any) => s + (Number(e.monto) || 0), 0);

                            return (
                                <section key={fecha} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="bg-white p-2 rounded-lg shadow-sm border border-orange-100 italic">
                                            <Calendar className="w-5 h-5 text-[#ff7908]" />
                                        </div>
                                        <h2 className="text-2xl font-black text-slate-800 capitalize tracking-tight">
                                            {formatearFecha(fecha)}
                                        </h2>
                                        <div className="h-[2px] flex-1 bg-gradient-to-r from-orange-200 to-transparent ml-2 opacity-50"></div>
                                        <div className="bg-gradient-to-br from-[#ff7908] to-[#ffac08] text-white px-6 py-2 rounded-2xl font-black text-xl shadow-lg shadow-orange-100 flex items-center gap-2">
                                            <span className="text-orange-100 text-sm font-bold uppercase">Total:</span>
                                            ${totalDia.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
                                        <Table>
                                            <TableHeader className="bg-slate-50/80">
                                                <TableRow className="hover:bg-transparent border-none">
                                                    <TableHead className="w-[120px] font-bold text-slate-500 pl-6">NOTA</TableHead>
                                                    <TableHead className="font-bold text-slate-500">CLIENTE</TableHead>
                                                    <TableHead className="font-bold text-slate-500">CONCEPTO / MÉTODO</TableHead>
                                                    <TableHead className="text-right font-bold text-slate-500 pr-6">MONTO</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {entries.map((e: any) => (
                                                    <TableRow key={e.id} className="group hover:bg-orange-50/30 transition-all border-slate-100">
                                                        <TableCell className="pl-6 font-black text-[#ff7908] text-base group-hover:scale-110 transition-transform origin-left">
                                                            #{e.numeroNota}
                                                        </TableCell>
                                                        <TableCell className="font-bold text-slate-700 uppercase tracking-tight text-sm">
                                                            {e.clienteNombre}
                                                        </TableCell>
                                                        <TableCell className="text-slate-600">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`p-1.5 rounded-lg ${e.nota?.includes('Tarjeta') ? 'bg-blue-50 text-blue-600' :
                                                                    e.nota?.includes('Transferencia') ? 'bg-purple-50 text-purple-600' :
                                                                        'bg-emerald-50 text-emerald-600'
                                                                    }`}>
                                                                    {e.nota?.includes('Tarjeta') ? <CreditCard className="w-4 h-4" /> :
                                                                        e.nota?.includes('Transferencia') ? <Send className="w-4 h-4" /> :
                                                                            <DollarSign className="w-4 h-4" />}
                                                                </div>
                                                                <span className="font-medium text-slate-500">{e.nota || "Abono a cuenta"}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-right pr-6">
                                                            <span className="font-black text-slate-900 text-xl tracking-tighter">
                                                                ${e.monto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                                            </span>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </section>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
