import { useState, useEffect } from "react";
import { ItemNota } from "../types/nota";
import { generateId } from "../utils/api";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Trash2, Plus, MessageCircle, DollarSign } from "lucide-react";
import { ImageUpload } from "./ImageUpload";
import { Switch } from "./ui/switch";

interface NotaFormProps {
  initialData?: {
    fecha: string;
    clienteNombre: string;
    clienteTelefono: string;
    fechaEvento?: string;
    fechaEntrega?: string;
    items: ItemNota[];
    imagenesReferencia?: string[];
    viaWhatsapp?: boolean;
    pagaAlRecibir?: boolean;
    comentarios?: string;
  };
  onSubmit: (data: {
    fecha: string;
    clienteNombre: string;
    clienteTelefono: string;
    fechaEvento?: string;
    fechaEntrega?: string;
    items: ItemNota[];
    total: number;
    imagenesReferencia: string[];
    viaWhatsapp: boolean;
    pagaAlRecibir: boolean;
    comentarios: string;
  }) => void;
  onCancel: () => void;
  submitLabel?: string;
}

export function NotaForm({ initialData, onSubmit, onCancel, submitLabel = "Crear Nota" }: NotaFormProps) {
  const getLocalDate = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  // Convierte un objeto Date a string YYYY-MM-DD usando hora LOCAL (no UTC)
  const dateToLocalString = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const [fecha, setFecha] = useState(initialData?.fecha || getLocalDate());
  const [clienteNombre, setClienteNombre] = useState(initialData?.clienteNombre || "");
  const [clienteTelefono, setClienteTelefono] = useState(initialData?.clienteTelefono || "");
  const [fechaEvento, setFechaEvento] = useState(initialData?.fechaEvento || "");
  const [fechaEntrega, setFechaEntrega] = useState(initialData?.fechaEntrega || "");
  const [imagenesReferencia, setImagenesReferencia] = useState<string[]>(initialData?.imagenesReferencia || []);
  const [viaWhatsapp, setViaWhatsapp] = useState(!!initialData?.viaWhatsapp);
  const [pagaAlRecibir, setPagaAlRecibir] = useState(!!initialData?.pagaAlRecibir);
  const [comentarios, setComentarios] = useState(initialData?.comentarios || "");
  const [items, setItems] = useState<ItemNota[]>(
    initialData?.items || [
      {
        id: generateId(),
        cantidad: 0,
        descripcion: "",
        precioUnitario: 0,
        importe: 0,
      },
    ]
  );

  const calcularImporte = (cantidad: number, precioUnitario: number) => {
    return cantidad * precioUnitario;
  };

  const agregarItem = () => {
    setItems([
      ...items,
      {
        id: generateId(),
        cantidad: 0,
        descripcion: "",
        precioUnitario: 0,
        importe: 0,
      },
    ]);
  };

  const eliminarItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id));
    }
  };

  const actualizarItem = (id: string, campo: keyof ItemNota, valor: string | number) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [campo]: valor };
          if (campo === "cantidad" || campo === "precioUnitario") {
            updated.importe = calcularImporte(
              Number(campo === "cantidad" ? valor : item.cantidad),
              Number(campo === "precioUnitario" ? valor : item.precioUnitario)
            );
          }
          return updated;
        }
        return item;
      })
    );
  };

  const calcularTotal = () => {
    return items.reduce((sum, item) => sum + item.importe, 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const total = calcularTotal();
    onSubmit({
      fecha,
      clienteNombre,
      clienteTelefono,
      fechaEvento,
      fechaEntrega,
      items,
      total,
      imagenesReferencia,
      viaWhatsapp,
      pagaAlRecibir,
      comentarios,
    });
  };

  const formatearFecha = (fechaISO: string) => {
    const date = new Date(fechaISO + "T00:00:00");
    const dia = date.getDate();
    const mes = date.getMonth() + 1;
    const anio = date.getFullYear().toString().slice(-2);
    return { dia, mes, anio };
  };

  const fechaFormateada = formatearFecha(fecha);

  return (
    <form
      onSubmit={handleSubmit}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          const target = e.target as HTMLElement;
          const tag = target.tagName.toLowerCase();
          // Allow Enter in textareas (for multi-line descriptions) and buttons
          if (tag !== "button" && tag !== "textarea") {
            e.preventDefault();
          }
        }
      }}
      className="space-y-6"
    >
      {/* Fecha y Número de Nota */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-[#ff7908] to-[#ffac08] text-white p-4 rounded-lg">
          <Label className="text-white text-center block mb-2">FECHA</Label>
          <div className="flex gap-2 items-center justify-center">
            <Input
              type="number"
              min="1"
              max="31"
              value={fechaFormateada.dia}
              onChange={(e) => {
                const newDate = new Date(fecha + "T00:00:00");
                newDate.setDate(Number(e.target.value));
                setFecha(dateToLocalString(newDate));
              }}
              className="w-16 text-center bg-white text-black"
              required
            />
            <span className="text-white text-xl">|</span>
            <Input
              type="number"
              min="1"
              max="12"
              value={fechaFormateada.mes}
              onChange={(e) => {
                const newDate = new Date(fecha + "T00:00:00");
                newDate.setMonth(Number(e.target.value) - 1);
                setFecha(dateToLocalString(newDate));
              }}
              className="w-16 text-center bg-white text-black"
              required
            />
            <span className="text-white text-xl">|</span>
            <Input
              type="number"
              min="0"
              max="99"
              value={fechaFormateada.anio}
              onChange={(e) => {
                const anioCompleto = 2000 + Number(e.target.value);
                const newDate = new Date(fecha + "T00:00:00");
                newDate.setFullYear(anioCompleto);
                setFecha(dateToLocalString(newDate));
              }}
              className="w-16 text-center bg-white text-black"
              required
            />
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#ff7908] to-[#ffac08] text-white p-4 rounded-lg flex flex-col justify-between">
          <div>
            <Label className="text-white text-center block mb-2">NOTA NÚMERO</Label>
            <div className="text-center text-2xl font-bold">AUTO</div>
          </div>
          <div className="mt-2 pt-2 border-t border-orange-300 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                <Label className="text-white cursor-pointer" htmlFor="whatsapp-toggle">Vía WhatsApp</Label>
              </div>
              <Switch
                id="whatsapp-toggle"
                checked={viaWhatsapp}
                onCheckedChange={setViaWhatsapp}
                className="data-[state=checked]:bg-green-500"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                <Label className="text-white cursor-pointer" htmlFor="paga-recibir-toggle">Paga al Recibir</Label>
              </div>
              <Switch
                id="paga-recibir-toggle"
                checked={pagaAlRecibir}
                onCheckedChange={setPagaAlRecibir}
                className="data-[state=checked]:bg-amber-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Cliente */}
      <div className="bg-gradient-to-br from-[#ff7908] to-[#ffac08] text-white p-4 rounded-lg">
        <h3 className="text-center font-bold mb-4">CLIENTE</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-white">Nombre:</Label>
              <Input
                type="text"
                value={clienteNombre}
                onChange={(e) => setClienteNombre(e.target.value)}
                className="bg-white text-black mt-1"
                required
              />
            </div>
            <div>
              <Label className="text-white">Tel:</Label>
              <Input
                type="tel"
                value={clienteTelefono}
                onChange={(e) => setClienteTelefono(e.target.value)}
                className="bg-white text-black mt-1"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-white">Fecha de Evento:</Label>
              <Input
                type="date"
                value={fechaEvento}
                onChange={(e) => setFechaEvento(e.target.value)}
                className="bg-white text-black mt-1"
              />
            </div>
            <div>
              <Label className="text-white">Fecha de Entrega:</Label>
              <Input
                type="date"
                value={fechaEntrega}
                onChange={(e) => setFechaEntrega(e.target.value)}
                className="bg-white text-black mt-1"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Comentarios Extras */}
      <div className="bg-gradient-to-br from-[#ff7908] to-[#ffac08] text-white p-4 rounded-lg shadow-sm">
        <h3 className="text-center font-bold mb-4">COMENTARIOS / PEDIDOS ESPECÍFICOS</h3>
        <Textarea
          value={comentarios}
          onChange={(e) => setComentarios(e.target.value)}
          placeholder="Escribe aquí las especificaciones del cliente..."
          className="bg-white text-black min-h-[100px] text-lg"
        />
      </div>

      {/* Imágenes de Referencia */}
      <div className="bg-gradient-to-br from-[#ff7908] to-[#ffac08] text-white p-4 rounded-lg shadow-sm">
        <h3 className="text-center font-bold mb-4">IMÁGENES DE REFERENCIA / DISEÑOS</h3>
        <div className="bg-white p-4 rounded-lg">
          <ImageUpload
            images={imagenesReferencia}
            onImagesChange={setImagenesReferencia}
            maxImages={5}
          />
        </div>
      </div>

      {/* Tabla de Items */}
      <div className="bg-white border-2 border-[#ff7908] rounded-lg overflow-hidden">
        <div className="bg-gradient-to-r from-[#ff7908] to-[#ffac08] text-white grid grid-cols-12 gap-2 p-3 font-bold text-center">
          <div className="col-span-2">CANT.</div>
          <div className="col-span-4">DESCRIPCIÓN</div>
          <div className="col-span-2">P. UNIT</div>
          <div className="col-span-3">IMPORTE</div>
          <div className="col-span-1"></div>
        </div>

        <div className="divide-y divide-[#ffac08]">
          {items.map((item, index) => (
            <div key={item.id} className="grid grid-cols-12 gap-2 p-2 items-center bg-white hover:bg-[#fffbc0]">
              <div className="col-span-2">
                <Input
                  type="number"
                  min="0"
                  value={item.cantidad || ""}
                  onChange={(e) => actualizarItem(item.id, "cantidad", Number(e.target.value))}
                  className="text-center"
                  placeholder="0"
                />
              </div>
              <div className="col-span-4">
                <Textarea
                  value={item.descripcion}
                  onChange={(e) => actualizarItem(item.id, "descripcion", e.target.value)}
                  placeholder="Descripción del producto"
                  rows={2}
                  className="resize-none min-h-[60px]"
                />
              </div>
              <div className="col-span-2">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.precioUnitario || ""}
                  onChange={(e) => actualizarItem(item.id, "precioUnitario", Number(e.target.value))}
                  className="text-center"
                  placeholder="0.00"
                />
              </div>
              <div className="col-span-3">
                <div className="text-center font-semibold text-[#ff7908]">
                  ${item.importe.toFixed(2)}
                </div>
              </div>
              <div className="col-span-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => eliminarItem(item.id)}
                  disabled={items.length === 1}
                  className="text-red-600 hover:text-red-800 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 bg-gradient-to-r from-[#fffb89] to-[#fffbc0] flex justify-between items-center">
          <Button type="button" onClick={agregarItem} variant="outline" className="border-[#ff7908] text-[#ff7908] hover:bg-[#fffbc0]">
            <Plus className="w-4 h-4 mr-2" />
            Agregar Item
          </Button>
          <div className="flex items-center gap-4">
            <span className="font-bold text-[#ff7908]">TOTAL:</span>
            <span className="text-2xl font-bold text-[#ff7908]">${calcularTotal().toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex gap-4 justify-end">
        <Button type="button" onClick={onCancel} variant="outline">
          Cancelar
        </Button>
        <Button type="submit" className="bg-gradient-to-r from-[#ff7908] to-[#ffac08] hover:from-[#ffac08] hover:to-[#ffe843] text-white">
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}