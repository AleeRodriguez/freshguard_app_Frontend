import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProductos } from '../context/ProductosContext';
import { useEffect } from 'react';

export default function DashboardScreen() {
  const { products, checkExpirations } = useProductos();

  useEffect(() => {
  checkExpirations();
}, []); // <-- sin dependencias

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const alertDate = new Date(today); alertDate.setDate(today.getDate() + 7);

  let totalQty = 0, totalWeight = 0;
  let expiringQty = 0, expiringWeight = 0;
  let expiredQty = 0, expiredWeight = 0;

  products.forEach(p => {
    const qty = Math.floor(p.cantidad) || 0;
    const weight = parseFloat(String(p.peso)) || 0;
    totalQty += qty; totalWeight += weight;
    if (p.fechaVencimiento) {
      const exp = new Date(p.fechaVencimiento + 'T00:00:00');
      if (exp < today) { expiredQty += qty; expiredWeight += weight; }
      else if (exp <= alertDate) { expiringQty += qty; expiringWeight += weight; }
    }
  });

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>FreshGuard</Text>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.welcome}>Resumen de Inventario</Text>

        <View style={[styles.card, styles.cardGreen]}>
          <Text style={styles.cardTitle}>Productos totales</Text>
          <Text style={styles.cardSub}>Cantidad / Peso</Text>
          <Text style={styles.cardValue}>{totalQty} ud. / {totalWeight.toFixed(2)} kg.</Text>
        </View>

        <View style={[styles.card, styles.cardYellow]}>
          <Text style={styles.cardTitle}>Proximos a vencer</Text>
          <Text style={styles.cardSub}>Cantidad / Peso</Text>
          <Text style={styles.cardValue}>{expiringQty} ud. / {expiringWeight.toFixed(2)} kg.</Text>
        </View>

        <View style={[styles.card, styles.cardRed]}>
          <Text style={styles.cardTitle}>Caducados</Text>
          <Text style={styles.cardSub}>Cantidad / Peso</Text>
          <Text style={styles.cardValue}>{expiredQty} ud. / {expiredWeight.toFixed(2)} kg.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  scroll: { flex: 1 },
  content: { padding: 24, gap: 16 },
  welcome: { fontSize: 22, fontWeight: 'bold', color: '#111827', marginBottom: 8 },
  card: { padding: 16, borderRadius: 12, borderWidth: 1 },
  cardGreen: { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' },
  cardYellow: { backgroundColor: '#FEFCE8', borderColor: '#FDE68A' },
  cardRed: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  cardTitle: { fontWeight: 'bold', fontSize: 16, color: '#111827' },
  cardSub: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  cardValue: { fontSize: 20, fontWeight: '600', marginTop: 8, color: '#111827' },
});