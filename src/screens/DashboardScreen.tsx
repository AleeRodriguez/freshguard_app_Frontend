import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Line, Rect, Text as SvgText } from 'react-native-svg';
import { useProductos } from '../context/ProductosContext';
import { useEffect, useState } from 'react';
import { ProductoCargado } from '../types/index';

type ModalType = 'todos' | 'proximos' | 'vencidos' | null;

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
  if (dias < 0) return `Vencido hace ${Math.abs(dias)} días`;
  if (dias === 0) return 'Vence hoy';
  if (dias === 1) return 'Vence mañana';
  return `Vence en ${dias} días`;
}

// ✅ Logo más grande y con fondo integrado
function FreshGuardLogo() {
  return (
    <Svg width="220" height="95" viewBox="0 125 680 300">
      <Path d="M295 155 L295 205 L340 220 L385 205 L385 155 L340 170 Z"
        fill="none" stroke="#22c55e" strokeWidth="2.2" strokeLinejoin="round"/>
      <Line x1="340" y1="170" x2="340" y2="220" stroke="#22c55e" strokeWidth="1" opacity="0.35"/>
      <Path d="M295 155 L272 141 L317 126 L340 140"
        fill="none" stroke="#22c55e" strokeWidth="2" strokeLinejoin="round" opacity="0.7"/>
      <Path d="M385 155 L408 141 L363 126 L340 140"
        fill="none" stroke="#22c55e" strokeWidth="2" strokeLinejoin="round" opacity="0.7"/>
      <Line x1="340" y1="140" x2="340" y2="170" stroke="#22c55e" strokeWidth="1" opacity="0.35"/>
      <Rect x="308" y="178" width="14" height="18" rx="2" fill="#22c55e" opacity="0.8"/>
      <Rect x="326" y="174" width="14" height="22" rx="2" fill="#22c55e" opacity="0.55"/>
      <Rect x="344" y="180" width="14" height="16" rx="2" fill="#22c55e" opacity="0.8"/>
      <Rect x="362" y="183" width="10" height="13" rx="2" fill="#22c55e" opacity="0.55"/>
      <SvgText x="340" y="252" textAnchor="middle" fontSize="30" fontWeight="500"
        letterSpacing="5" fill="#22c55e">FRESHGUARD</SvgText>
    </Svg>
  );
}

export default function DashboardScreen() {
  const { products, checkExpirations } = useProductos();
  const [modalTipo, setModalTipo] = useState<ModalType>(null);

  useEffect(() => {
    checkExpirations();
  }, []);

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const alertDate = new Date(today); alertDate.setDate(today.getDate() + 7);

  let totalQty = 0, totalWeight = 0;
  let expiringQty = 0, expiringWeight = 0;
  let expiredQty = 0, expiredWeight = 0;

  const proximos: ProductoCargado[] = [];
  const vencidos: ProductoCargado[] = [];

  products.forEach(p => {
    const qty = Math.floor(p.cantidad) || 0;
    const weight = (parseFloat(String(p.peso)) || 0) * qty;
    totalQty += qty; totalWeight += weight;
    if (p.fechaVencimiento) {
      const exp = new Date(p.fechaVencimiento + 'T00:00:00');
      if (exp < today) { expiredQty += qty; expiredWeight += weight; vencidos.push(p); }
      else if (exp <= alertDate) { expiringQty += qty; expiringWeight += weight; proximos.push(p); }
    }
  });

  function getModalData(): { titulo: string; lista: ProductoCargado[] } {
    if (modalTipo === 'todos') return { titulo: 'Todos los productos', lista: products };
    if (modalTipo === 'proximos') return { titulo: 'Próximos a vencer', lista: proximos };
    if (modalTipo === 'vencidos') return { titulo: 'Caducados', lista: vencidos };
    return { titulo: '', lista: [] };
  }

  const { titulo, lista } = getModalData();

  return (
    <SafeAreaView style={styles.safe}>

      {/* ✅ Logo centrado con fondo que tapa el gris */}
      <View style={styles.logoContainer}>
        <FreshGuardLogo />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.welcome}>Resumen de Inventario</Text>

        <TouchableOpacity style={[styles.card, styles.cardGreen]} onPress={() => setModalTipo('todos')}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Productos totales</Text>
            <Text style={styles.cardArrow}>›</Text>
          </View>
          <Text style={styles.cardSub}>Cantidad / Peso total</Text>
          <Text style={styles.cardValue}>{totalQty} ud. / {totalWeight.toFixed(2)} kg.</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.card, styles.cardYellow]} onPress={() => setModalTipo('proximos')}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Próximos a vencer</Text>
            <Text style={styles.cardArrow}>›</Text>
          </View>
          <Text style={styles.cardSub}>Cantidad / Peso total</Text>
          <Text style={styles.cardValue}>{expiringQty} ud. / {expiringWeight.toFixed(2)} kg.</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.card, styles.cardRed]} onPress={() => setModalTipo('vencidos')}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Caducados</Text>
            <Text style={styles.cardArrow}>›</Text>
          </View>
          <Text style={styles.cardSub}>Cantidad / Peso total</Text>
          <Text style={styles.cardValue}>{expiredQty} ud. / {expiredWeight.toFixed(2)} kg.</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* ✅ Modal fuera del ScrollView */}
      <Modal visible={!!modalTipo} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{titulo}</Text>
            <Text style={styles.modalCount}>{lista.length} {lista.length === 1 ? 'producto' : 'productos'}</Text>

            <ScrollView style={styles.modalScroll}>
              {lista.length === 0 ? (
                <Text style={styles.modalEmpty}>No hay productos en esta categoría.</Text>
              ) : (
                lista
                  .sort((a, b) => new Date(a.fechaVencimiento).getTime() - new Date(b.fechaVencimiento).getTime())
                  .map(p => {
                    const dias = diasParaVencer(p.fechaVencimiento);
                    return (
                      <View key={p.id} style={styles.loteCard}>
                        <View style={styles.loteInfo}>
                          <Text style={styles.loteNombre}>{p.nombre} <Text style={styles.loteMarca}>{p.marca}</Text></Text>
                          <Text style={styles.loteCantidad}>
                            {p.cantidad} paquetes · {(parseFloat(String(p.peso)) * p.cantidad).toFixed(2)} kg. total
                          </Text>
                          <Text style={styles.loteVenc}>
                            Venc: {p.fechaVencimiento.split('-').reverse().join('/')}
                          </Text>
                        </View>
                        <Text style={[styles.loteStatus, { color: statusColor(dias) }]}>
                          {statusText(dias)}
                        </Text>
                      </View>
                    );
                  })
              )}
            </ScrollView>

            <TouchableOpacity style={styles.closeBtn} onPress={() => setModalTipo(null)}>
              <Text style={styles.closeBtnText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FAFB' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  scroll: { flex: 1 },
  content: { padding: 24, gap: 16 },
  welcome: { fontSize: 22, fontWeight: 'bold', color: '#111827', marginBottom: 8 },

  // ✅ Fondo igual al safe area, sin borde, centrado
  logoContainer: {
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingVertical: 0,
  },

  card: { padding: 16, borderRadius: 12, borderWidth: 1 },
  cardGreen: { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' },
  cardYellow: { backgroundColor: '#FEFCE8', borderColor: '#FDE68A' },
  cardRed: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontWeight: 'bold', fontSize: 16, color: '#111827' },
  cardArrow: { fontSize: 18, color: '#9CA3AF' },
  cardSub: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  cardValue: { fontSize: 20, fontWeight: '600', marginTop: 8, color: '#111827' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 8, maxHeight: '85%' },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  modalCount: { fontSize: 13, color: '#6B7280' },
  modalScroll: { maxHeight: 400 },
  modalEmpty: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', paddingTop: 24 },
  loteCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  loteInfo: { flex: 1, gap: 2 },
  loteNombre: { fontSize: 14, fontWeight: '700', color: '#111827' },
  loteMarca: { fontWeight: '400', color: '#6B7280' },
  loteCantidad: { fontSize: 13, color: '#6B7280' },
  loteVenc: { fontSize: 12, color: '#9CA3AF' },
  loteStatus: { fontSize: 12, fontWeight: '600', textAlign: 'right', marginLeft: 8 },
  closeBtn: { backgroundColor: '#111827', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 8 },
  closeBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});