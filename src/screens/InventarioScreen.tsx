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

export default function InventarioScreen() {
  const { products, loading, refreshProducts, deleteProduct } = useProductos();
  const [selected, setSelected] = useState<ProductoCargado | null>(null);

  useEffect(() => {
    refreshProducts();
  }, []);

  function handleDelete(product: ProductoCargado) {
    Alert.alert(
      'Eliminar producto',
      `¿Seguro que queres eliminar "${product.nombre}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await deleteProduct(product.id);
            setSelected(null);
          }
        }
      ]
    );
  }

  const sorted = [...products].sort((a, b) =>
    new Date(a.fechaVencimiento).getTime() - new Date(b.fechaVencimiento).getTime()
  );

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
        {sorted.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No hay productos en el inventario.</Text>
            <Text style={styles.emptySubtext}>Agrega uno desde el menu.</Text>
          </View>
        ) : (
          sorted.map(product => {
            const dias = diasParaVencer(product.fechaVencimiento);
            const color = statusColor(dias);
            return (
              <TouchableOpacity key={product.id} style={styles.card} onPress={() => setSelected(product)}>
                <View style={styles.cardLeft}>
                  <Text style={styles.cardName}>{product.nombre} <Text style={styles.cardBrand}>{product.marca}</Text></Text>
                  <Text style={styles.cardQty}>{product.cantidad} ud. / {product.peso.toFixed(2)} kg.</Text>
                </View>
                <View style={styles.cardRight}>
                  <Text style={[styles.cardStatus, { color }]}>{statusText(dias)}</Text>
                  <Text style={styles.cardDate}>Venc: {product.fechaVencimiento.split('-').reverse().join('/')}</Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      <Modal visible={!!selected} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selected && (
              <>
                <Text style={styles.modalTitle}>{selected.nombre}</Text>
                <Text style={styles.modalBrand}>{selected.marca}</Text>

                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Categoria</Text>
                  <Text style={styles.modalValue}>{selected.categoria || '-'}</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Cantidad / Peso</Text>
                  <Text style={styles.modalValue}>{selected.cantidad} ud. / {selected.peso.toFixed(2)} kg.</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Fecha de ingreso</Text>
                  <Text style={styles.modalValue}>{selected.fechaIngreso.split('-').reverse().join('/')}</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Fecha de vencimiento</Text>
                  <Text style={styles.modalValue}>{selected.fechaVencimiento.split('-').reverse().join('/')}</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalLabel}>Estado</Text>
                  <Text style={[styles.modalValue, { color: statusColor(diasParaVencer(selected.fechaVencimiento)), fontWeight: '700' }]}>
                    {statusText(diasParaVencer(selected.fechaVencimiento))}
                  </Text>
                </View>

                <TouchableOpacity style={styles.closeBtn} onPress={() => setSelected(null)}>
                  <Text style={styles.closeBtnText}>Cerrar</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(selected)}>
                  <Text style={styles.deleteBtnText}>🗑️ Eliminar producto</Text>
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
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 12 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: '#111827' },
  modalBrand: { fontSize: 15, color: '#6B7280', marginTop: -8 },
  modalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  modalLabel: { fontSize: 14, color: '#6B7280' },
  modalValue: { fontSize: 14, color: '#111827', fontWeight: '500' },
  closeBtn: { backgroundColor: '#111827', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 8 },
  closeBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  deleteBtn: { backgroundColor: '#FEE2E2', borderRadius: 10, padding: 16, alignItems: 'center' },
  deleteBtnText: { color: '#EF4444', fontWeight: '700', fontSize: 16 },
});