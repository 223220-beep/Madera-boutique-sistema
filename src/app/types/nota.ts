export interface ItemNota {
  id: string;
  cantidad: number;
  descripcion: string;
  precioUnitario: number;
  importe: number;
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
  clienteDomicilio: string;
  clienteTelefono: string;
  items: ItemNota[];
  total: number;
  createdAt: string;
  updatedAt: string;
  // Nuevos campos
  terminada: boolean;
  pagada: boolean;
  entregada: boolean;
  asignadoA: string | null;
  viaWhatsapp: boolean;
  imagenesReferencia: string[];
  abonos: Abono[];
}