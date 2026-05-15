import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ProductoCargado, EventoReporte, EventType } from '../types/index';
import { getProductosCargados, agregarProductoCargado, eliminarProductoCargado, actualizarCantidadProducto } from '../services/productosService';
import { enviarNotificacionLocal } from '../services/notificaciones';


interface ProductosContextType {
  products: ProductoCargado[];
  eventLog: EventoReporte[];
  loading: boolean;
  addProduct: (product: Omit<ProductoCargado, 'id'>) => Promise<void>;
  deleteProduct: (id: number) => Promise<void>;
  logEvent: (type: EventType, message: string, productId: number | null) => void;
  checkExpirations: () => void;
  refreshProducts: () => Promise<void>;
  updateProductQuantity: (id: number, cantidad: number) => Promise<void>;
}

const ProductosContext = createContext<ProductosContextType | undefined>(undefined);

export function ProductosProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<ProductoCargado[]>([]);
  const [eventLog, setEventLog] = useState<EventoReporte[]>([]);
  const [loading, setLoading] = useState(false);

  async function refreshProducts() {
    try {
      setLoading(true);
      const data = await getProductosCargados();
      setProducts(data);
    } catch (err) {
      console.error('Error cargando productos:', err);
    } finally {
      setLoading(false);
    }
  }

  async function updateProductQuantity(id: number, cantidad: number) {
  try {
    await actualizarCantidadProducto(id, cantidad);
    setProducts(prev => prev.map(p => p.id === id ? { ...p, cantidad } : p));
  } catch (err) {
    console.error('Error actualizando cantidad:', err);
  }
}

  useEffect(() => {
    refreshProducts();
  }, []);

  function logEvent(type: EventType, message: string, productId: number | null) {
    setEventLog(prev => [...prev, { type, message, timestamp: new Date(), productId }]);
  }

  async function addProduct(product: Omit<ProductoCargado, 'id'>) {
    try {
      setLoading(true);
      const nuevo = await agregarProductoCargado(product);
      setProducts(prev => [...prev, nuevo]);
      logEvent('added', `Se agrego '${nuevo.nombre}' al inventario.`, nuevo.id);
    } catch (err) {
      console.error('Error agregando producto:', err);
    } finally {
      setLoading(false);
    }
  }

  async function deleteProduct(id: number) {
    try {
      await eliminarProductoCargado(id);
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error('Error eliminando producto:', err);
    }
  }

  function checkExpirations() {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const alertDate = new Date(today); alertDate.setDate(today.getDate() + 7);

    let huboCambios = false;

    const updatedProducts = products.map(p => {
      const updated = { ...p };
      const expiryDate = new Date(p.fechaVencimiento + 'T00:00:00');

      if (expiryDate < today && !p.expiredNotified) {
        logEvent('expired', `El producto '${p.nombre}' ha vencido.`, p.id);
        enviarNotificacionLocal('⚠️ Producto vencido', `${p.nombre} ha vencido.`);
        updated.expiredNotified = true;
        huboCambios = true;
      }

      if (expiryDate <= alertDate && expiryDate >= today && !p.expiringNotified) {
        logEvent('expiring', `El producto '${p.nombre}' esta proximo a vencer.`, p.id);
        enviarNotificacionLocal('🕐 Proximo a vencer', `${p.nombre} vence pronto.`);
        updated.expiringNotified = true;
        huboCambios = true;
      }

      return updated;
    });

    if (huboCambios) setProducts(updatedProducts);
  }

  return (
    return (
  <ProductosContext.Provider value={{ products, eventLog, loading, addProduct, deleteProduct, logEvent, checkExpirations, refreshProducts, updateProductQuantity }}>
    {children}
  </ProductosContext.Provider>
);
}

export function useProductos() {
  const ctx = useContext(ProductosContext);
  if (!ctx) throw new Error('useProductos debe usarse dentro de ProductosProvider');
  return ctx;
}