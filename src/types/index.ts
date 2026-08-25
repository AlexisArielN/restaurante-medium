export interface Mesa {
  id: number;
  numero: number;
  estado: boolean;
}

export interface Presa {
  id: number;
  nombre: string;
}

export interface Plato {
  id: number;
  nombre: string;
  precio: string; // Decimal serializado como string
  cantidad_disponible: number;
  presas?: PlatoPresa[];
}

export interface PlatoPresa {
  id: number;
  plato_id: number;
  presa_id: number;
  plato?: Plato;
  presa?: Presa;
}

export interface DetallePedido {
  id: number;
  pedido_id: number;
  plato_id: number;
  cantidad: number;
  subtotal: string;
  plato?: Plato;
}

export interface Pedido {
  id: number;
  mesa_id: number;
  fecha: string;
  total: string;
  estado: string;
  mesa?: Mesa;
  detalles?: DetallePedido[];
}

export const ESTADOS_PEDIDO = [
  "pendiente",
  "en_preparacion",
  "entregado",
  "cancelado",
] as const;

export type EstadoPedido = (typeof ESTADOS_PEDIDO)[number];
