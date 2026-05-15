import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, ActivityIndicator, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { useProductos } from '../context/ProductosContext';
import { ProductoCargado } from '../types/index';

function diasParaVencer(fechaVencimiento: string): number {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const expiry = new Date(fechaVencimiento + 'T00:00:00');
  return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function statusColor(dias: number): string {
  if (dias < 0) return '#EF4444';
  if (dias <= 7) return '#F59E0B';
  return '#10B981';
}

function statusText(dias: number): string {
  if (dias < 0) return `Vencido hace ${Math.abs(dias)} dias`;
  if (dias === 0) return 'Vence hoy';
  if (dias === 1) return 'Vence manana';
  return `Vence en ${dias} dias`;
}

// Agrupa lotes por nombre + marca
interface GrupoProducto {
  nombre: string;
  marca: string;
  categoria: string;
  lotes: ProductoCargado[];
  totalCantidad: number;
  totalPeso: number;
  diasMinimos: number; // el lote que vence antes
}

function agruparProductos(products: ProductoCargado[]): GrupoProducto[] {
  const mapa = new Map<string, GrupoProducto>();

  products.forEach(p => {
    const key = `${p.nombre.trim().toLowerCase()}|${p.marca.trim().toLowerCase()}`;
    if (!mapa.has(key)) {
      mapa.set(key, {
        nombre: p.nombre,
        marca: p.marca,
        categoria: p.categoria,
        lotes: [],
        totalCantidad: 0,
        totalPeso: 0,
        diasMinimos: Infinity,
      });
    }
    const grupo = mapa.get(key)!;
    grupo.lotes.push(p);
    grupo.totalCantidad += Math.floor(p.cantidad) || 0;
    grupo.totalPeso += parseFloat(String(p.peso)) || 0;
    const dias = diasParaVencer(p.fechaVencimiento);
    if (dias < grupo.diasMinimos) grupo.diasMinimos = dias;
  });

  return Array.from(mapa.values()).sort((a, b) => a.diasMinimos - b.diasMinimos);
}

export default function InventarioScreen() {
  const { products, loading, refreshProducts, deleteProduct } = useProductos();
  const [selectedGrupo, setSelectedGrupo] = useState<GrupoProducto | null>(null);

  useEffect(() => {
    refreshProducts();
  }, []);

  function handleDelete(product: ProductoCargado) {
    Alert.alert(
      'Eliminar lote',
      `¿Seguro que queres eliminar este lote de "${product.nombre}" (vence ${product.fechaVencimiento.split('-').reverse().join('/')})?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await deleteProduct(product.id);
            // Actualizar el grupo seleccionado después de eliminar
            const lotesRestantes = selectedGrupo!.lotes.filter(l => l.id !== product.id);
            if (lotesRestantes.length === 0) {
              setSelectedGrupo(null);
            } else {
              setSelectedGrupo({ ...selectedGrupo!, lotes: lotesRestantes });
            }
          }
        }
      ]
    );
  }

  const grupos = agruparProductos(products);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#111827" />
        <Text style={styles.loadingText}>Cargando inventario...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <ScrollView contentContainerStyle={styles.content}>
        {grupos.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No hay productos en el inventario.</Text>
            <Text style={styles.emptySubtext}>Agrega uno desde el menu.</Text>
          </View>
        ) : (
          grupos.map((grupo, idx) => {
            const color = statusColor(grupo.diasMinimos);
            return (
              <TouchableOpacity key={idx} style={styles.card} onPress={() => setSelectedGrupo(grupo)}>
                <View style={styles.cardLeft}>
                  <Text style={styles.cardName}>
                    {grupo.nombre} <Text style={styles.cardBrand}>{grupo.marca}</Text>
                  </Text>
                  <Text style={styles.cardQty}>
                    {grupo.totalCantidad} ud. / {grupo.totalPeso.toFixed(2)} kg. · {grupo.lotes.length} {grupo.lotes.length === 1 ? 'lote' : 'lotes'}
                  </Text>
                </View>
                <View style={styles.cardRight}>
                  <Text style={[styles.cardStatus, { color }]}>{statusText(grupo.diasMinimos)}</Text>
                  <Text style={styles.cardDate}>Próximo venc.</Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Modal de detalle de lotes */}
      <Modal visible={!!selectedGrupo} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedGrupo && (
              <>
                <Text style={styles.modalTitle}>{selectedGrupo.nombre}</Text>
                <Text style={styles.modalBrand}>{selectedGrupo.marca} · {selectedGrupo.categoria || 'Sin categoria'}</Text>
                <Text style={styles.modalTotalLabel}>
                  Total: {selectedGrupo.totalCantidad} ud. / {selectedGrupo.totalPeso.toFixed(2)} kg.
                </Text>

                <Text style={styles.lotesTitle}>Lotes cargados</Text>

                <ScrollView style={styles.lotesScroll}>
                  {selectedGrupo.lotes
                    .sort((a, b) => new Date(a.fechaVencimiento).getTime() - new Date(b.fechaVencimiento).getTime())
                    .map(lote => {
                      const dias = diasParaVencer(lote.fechaVencimiento);
                      return (
                        <View key={lote.id} style={styles.loteCard}>
                          <View style={styles.loteInfo}>
                            <Text style={styles.loteVenc}>
                              Venc: {lote.fechaVencimiento.split('-').reverse().join('/')}
                            </Text>
                            <Text style={[styles.loteStatus, { color: statusColor(dias) }]}>
                              {statusText(dias)}
                            </Text>
                            <Text style={styles.loteCantidad}>
                              {lote.cantidad} ud. / {parseFloat(String(lote.peso)).toFixed(2)} kg.
                            </Text>
                            <Text style={styles.loteIngreso}>
                              Ingresado: {lote.fechaIngreso.split('-').reverse().join('/')}
                            </Text>
                          </View>
                          <TouchableOpacity
                            style={styles.loteDeleteBtn}
                            onPress={() => handleDelete(lote)}
                          >
                            <Text style={styles.loteDeleteText}>🗑️</Text>
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                </ScrollView>

                <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedGrupo(null)}>
                  <Text style={styles.closeBtnText}>Cerrar</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB', gap: 12 },
  loadingText: { fontSize: 14, color: '#6B7280' },
  content: { padding: 16, gap: 12 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyText: { fontSize: 16, color: '#6B7280', fontWeight: '600' },
  emptySubtext: { fontSize: 13, color: '#9CA3AF', marginTop: 4 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  cardLeft: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  cardBrand: { fontWeight: '400', color: '#6B7280' },
  cardQty: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  cardRight: { alignItems: 'flex-end', marginLeft: 12 },
  cardStatus: { fontSize: 13, fontWeight: '600' },
  cardDate: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 8, maxHeight: '85%' },
  modalTitle: { fontSize: 22, fontWeight: '800', color: '#111827' },
  modalBrand: { fontSize: 14, color: '#6B7280' },
  modalTotalLabel: { fontSize: 14, color: '#111827', fontWeight: '600', marginTop: 4 },
  lotesTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginTop: 8, marginBottom: 4 },
  lotesScroll: { maxHeight: 300 },
  loteCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  loteInfo: { flex: 1, gap: 2 },
  loteVenc: { fontSize: 14, fontWeight: '700', color: '#111827' },
  loteStatus: { fontSize: 13, fontWeight: '600' },
  loteCantidad: { fontSize: 13, color: '#6B7280' },
  loteIngreso: { fontSize: 12, color: '#9CA3AF' },
  loteDeleteBtn: { padding: 8 },
  loteDeleteText: { fontSize: 20 },
  closeBtn: { backgroundColor: '#111827', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 8 },
  closeBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});