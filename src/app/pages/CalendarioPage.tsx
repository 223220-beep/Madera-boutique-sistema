import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router";
import { notasApi } from "../utils/api";
import { useSocket } from "../utils/socket";
import { Nota } from "../types/nota";
import { Button } from "../components/ui/button";
import { NotaHeader } from "../components/NotaHeader";
import { Badge } from "../components/ui/badge";
import { ChevronLeft, ChevronRight, CalendarDays, Eye } from "lucide-react";
import { toast } from "sonner";

const DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MESES = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export function CalendarioPage() {
    const [notas, setNotas] = useState<Nota[]>([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const { onNotaCreated, onNotaUpdated } = useSocket();

    useEffect(() => {
        cargarNotas();
    }, []);

    useEffect(() => {
        const unsub1 = onNotaCreated(() => cargarNotas());
        const unsub2 = onNotaUpdated(() => cargarNotas());
        return () => { unsub1(); unsub2(); };
    }, [onNotaCreated, onNotaUpdated]);

    const cargarNotas = async () => {
        try {
            const data = await notasApi.getAll();
            setNotas(data);
        } catch (err) {
            toast.error("Error al cargar notas");
        }
    };

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Build a map: "YYYY-MM-DD" -> Nota[]
    const entregasPorDia = useMemo(() => {
        const map: Record<string, Nota[]> = {};
        notas.forEach((nota) => {
            if (nota.fechaEntrega) {
                const key = nota.fechaEntrega; // format is already YYYY-MM-DD
                if (!map[key]) map[key] = [];
                map[key].push(nota);
            }
        });
        return map;
    }, [notas]);

    // Calendar grid computation
    const firstDayOfMonth = new Date(year, month, 1);
    // Monday = 0, Sunday = 6 (ISO style)
    let startWeekday = firstDayOfMonth.getDay() - 1;
    if (startWeekday < 0) startWeekday = 6;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const totalCells = Math.ceil((startWeekday + daysInMonth) / 7) * 7;

    const calendarCells: { day: number | null; dateKey: string | null }[] = [];
    for (let i = 0; i < totalCells; i++) {
        const dayNum = i - startWeekday + 1;
        if (dayNum >= 1 && dayNum <= daysInMonth) {
            const mm = String(month + 1).padStart(2, "0");
            const dd = String(dayNum).padStart(2, "0");
            calendarCells.push({ day: dayNum, dateKey: `${year}-${mm}-${dd}` });
        } else {
            calendarCells.push({ day: null, dateKey: null });
        }
    }

    const today = new Date();
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
    const goToday = () => setCurrentDate(new Date());

    // Count total deliveries this month
    const totalEntregasMes = useMemo(() => {
        let count = 0;
        calendarCells.forEach((cell) => {
            if (cell.dateKey && entregasPorDia[cell.dateKey]) {
                count += entregasPorDia[cell.dateKey].length;
            }
        });
        return count;
    }, [calendarCells, entregasPorDia]);

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <NotaHeader showFullHeader={false} />
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                        <div className="flex items-center gap-3">
                            <CalendarDays className="w-8 h-8 text-[#ff7908]" />
                            <h2 className="text-3xl font-bold text-[#ff7908]">Calendario de Entregas</h2>
                        </div>
                        <div className="flex gap-2">
                            <Badge className="bg-[#ff7908] text-white text-sm px-3 py-1">
                                {totalEntregasMes} entregas este mes
                            </Badge>
                            <Link to="/">
                                <Button variant="outline">Volver al Inicio</Button>
                            </Link>
                        </div>
                    </div>

                    {/* Month Navigation */}
                    <div className="flex justify-between items-center mb-6 bg-gradient-to-r from-[#ff7908] to-[#ffac08] rounded-xl p-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={prevMonth}
                            className="text-white hover:bg-white/20"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </Button>
                        <div className="text-center">
                            <h3 className="text-2xl font-bold text-white">
                                {MESES[month]} {year}
                            </h3>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={goToday}
                                className="text-white/80 hover:text-white hover:bg-white/20 text-xs mt-1"
                            >
                                Ir a Hoy
                            </Button>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={nextMonth}
                            className="text-white hover:bg-white/20"
                        >
                            <ChevronRight className="w-6 h-6" />
                        </Button>
                    </div>

                    {/* Day Headers */}
                    <div className="grid grid-cols-7 gap-1 mb-1">
                        {DIAS_SEMANA.map((dia) => (
                            <div
                                key={dia}
                                className="text-center font-bold text-sm text-gray-600 py-2 bg-gray-100 rounded"
                            >
                                {dia}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1">
                        {calendarCells.map((cell, idx) => {
                            const entregas = cell.dateKey ? entregasPorDia[cell.dateKey] || [] : [];
                            const isToday = cell.dateKey === todayKey;
                            const isPast = cell.dateKey ? cell.dateKey < todayKey : false;

                            return (
                                <div
                                    key={idx}
                                    className={`
                    min-h-[100px] border rounded-lg p-1.5 transition-all
                    ${!cell.day ? "bg-gray-50 border-gray-100" : "border-gray-200 hover:border-[#ff7908]/50 hover:shadow-sm"}
                    ${isToday ? "bg-orange-50 border-[#ff7908] border-2 shadow-md" : ""}
                    ${isPast && !isToday && cell.day ? "bg-gray-50/50" : ""}
                  `}
                                >
                                    {cell.day && (
                                        <>
                                            <div className={`text-right text-sm font-semibold mb-1 ${isToday ? "text-[#ff7908]" : isPast ? "text-gray-400" : "text-gray-700"}`}>
                                                {isToday ? (
                                                    <span className="inline-flex items-center justify-center w-7 h-7 bg-[#ff7908] text-white rounded-full text-xs font-bold">
                                                        {cell.day}
                                                    </span>
                                                ) : (
                                                    cell.day
                                                )}
                                            </div>
                                            <div className="space-y-1 overflow-y-auto max-h-[70px]">
                                                {entregas.map((nota) => (
                                                    <Link
                                                        key={nota.id}
                                                        to={`/ver/${nota.id}`}
                                                        className="block"
                                                    >
                                                        <div
                                                            className={`
                                text-xs px-1.5 py-1 rounded-md truncate cursor-pointer transition-all hover:scale-[1.02]
                                ${nota.entregada
                                                                    ? "bg-green-100 text-green-800 line-through"
                                                                    : nota.urgente
                                                                        ? "bg-red-100 text-red-800 border border-red-300 font-bold animate-pulse"
                                                                        : "bg-orange-100 text-orange-800 border border-orange-200"
                                                                }
                              `}
                                                            title={`Nota #${nota.numeroNota} - ${nota.clienteNombre}`}
                                                        >
                                                            <span className="font-bold">#{nota.numeroNota}</span>{" "}
                                                            {nota.clienteNombre}
                                                        </div>
                                                    </Link>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Legend */}
                    <div className="mt-6 flex flex-wrap gap-4 justify-center text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-orange-100 border border-orange-200" />
                            <span>Pendiente de entregar</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-red-100 border border-red-300" />
                            <span>Urgente</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-green-100 border border-green-200" />
                            <span>Entregada</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center justify-center w-4 h-4 bg-[#ff7908] text-white rounded-full text-[8px] font-bold">H</span>
                            <span>Hoy</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
