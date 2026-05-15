import API_URL from '../config/api';
import { ProductoCargado } from '../types/index';

export async function getProductosCargados(): Promise<ProductoCargado[]> {
  const res = await fetch(`${API_URL}/api/productos/cargados`);
  if (!res.ok) throw new Error('Error al obtener productos');
  return res.json();
}

export async function agregarProductoCargado(producto: Omit<ProductoCargado, 'id'>): Promise<ProductoCargado> {
  const res = await fetch(`${API_URL}/api/productos/cargados`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(producto),
  });
  if (!res.ok) throw new Error('Error al agregar producto');
  return res.json();
}

export async function getProductoPorBarcode(codigo: string): Promise<ProductoCargado | null> {
  try {
    const res = await fetch(`${API_URL}/api/productos/barcode/${codigo}`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
export async function eliminarProductoCargado(id: number): Promise<void> {
  const res = await fetch(`${API_URL}/api/productos/cargados/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Error al eliminar producto');
}

export async function buscarEnInventarioPorBarcode(barcode: string): Promise<ProductoCargado | null> {
  try {
    const res = await fetch(`${API_URL}/api/productos/cargados/barcode/${barcode}`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function buscarProductoPorBarcode(barcode: string) {
  try {
    // Primero intenta con Open Food Facts Argentina
    const res = await fetch(`https://ar.openfoodfacts.org/api/v0/product/${barcode}.json`);
    const data = await res.json();
    
    if (data.status === 1 && data.product) {
      const p = data.product;
      return {
        nombre: p.product_name || p.product_name_es || p.abbreviated_product_name || '',
        marca: p.brands || '',
        categoria: p.categories_tags?.[0]?.replace('en:', '').replace('es:', '') || '',
        imagenUrl: p.image_url || '',
      };
    }

    // Si no encuentra en Argentina, intenta en mundial
    const res2 = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
    const data2 = await res2.json();

    if (data2.status === 1 && data2.product) {
      const p = data2.product;
      return {
        nombre: p.product_name || p.product_name_es || '',
        marca: p.brands || '',
        categoria: p.categories_tags?.[0]?.replace('en:', '').replace('es:', '') || '',
        imagenUrl: p.image_url || '',
      };
    }

    return null;
  } catch {
    return null;
  }
}
