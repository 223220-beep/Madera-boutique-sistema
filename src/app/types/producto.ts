export interface Producto {
  id: string;
  codigo: string;
  nombre: string;
  precioNormal: number;
  precioMayoreo: number;
  createdAt?: string;
  updatedAt?: string;
}
