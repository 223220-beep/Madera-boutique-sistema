export interface ItemNota {
  id: string;
  cantidad: number;
  descripcion: string;
  precioUnitario: number;
  importe: number;
  terminado?: boolean;
  entregado?: boolean;
}

export interface Abono {
  id: string;
  fecha: string;
  monto: number;
  nota?: string;
}

export interface Nota {
  id: string;
  numeroNota: string;
  fecha: string;
  clienteNombre: string;
  clienteTelefono: string;
  fechaEvento?: string;
  fechaEntrega?: string;
  comentarios?: string;
  items: ItemNota[];
  total: number;
  createdAt: string;
  updatedAt: string;
  // Nuevos campos
  terminada: boolean;
  pagada: boolean;
  entregada: boolean;
  asignadoA: string[];
  disenadoresTerminados: string[];
  urgente: boolean;
  viaWhatsapp: boolean;
  pagaAlRecibir: boolean;
  imagenesReferencia: string[];
  abonos: Abono[];
}