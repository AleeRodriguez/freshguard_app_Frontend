export type UserRole = 'encargado' | 'empleado';

export type EventType = 'added' | 'expired' | 'expiring';

export interface ProductoCargado {
  id: number;
  nombre: string;
  marca: string;
  categoria: string;
  codigoBarras?: string;
  cantidad: number;
  peso: number;
  fechaIngreso: string;
  fechaVencimiento: string;
  expiredNotified: boolean;
  expiringNotified: boolean;
}
export interface EventoReporte {
  type: EventType;
  message: string;
  timestamp: Date;
  productId: number | null;
  usuarioNombre: string;
}