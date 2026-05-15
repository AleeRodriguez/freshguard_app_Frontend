import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useState } from 'react';
import { useProductos } from '../context/ProductosContext';
import { EventType } from '../types/index';

const typeConfig: Record<EventType, { label: string; color: string; bg: string }> = {
  added: { label: 'Agregado', color: '#065F46', bg: '#D1FAE5' },
  expired: { label: 'Vencido', color: '#991B1B', bg: '#FEE2E2' },
  expiring: { label: 'Por vencer', color: '#92400E', bg: '#FEF3C7' },
};

export default function ReportesScreen() {
  const { eventLog } = useProductos();
  const [filtros, setFiltros] = useState<Record<EventType, boolean>>({
    added: true, expired: true, expiring: true,
  });
  const [fechaFiltro, setFechaFiltro] = useState('');

  function toggleFiltro(type: EventType) {
    setFiltros(prev => ({ ...prev, [type]: !prev[type] }));
  }

  function toggleTodos() {
    const todosActivos = Object.values(filtros).every(v => v);
    setFiltros({ added: !todosActivos, expired: !todosActivos, expiring: !todosActivos });
  }

  const todosActivos = Object.values(filtros).every(v => v);

  const filtered = [...eventLog]
    .filter(e => {
      if (!filtros[e.type]) return false;
      if (fechaFiltro) {
        const eventDate = e.timestamp.toISOString().split('T')[0];
        if (eventDate !== fechaFiltro) return false;
      }
      return true;
    })
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>

      {/* FILTROS */}
      <View style={styles.filterBar}>
        <TouchableOpacity
          style={[styles.filterChip, todosActivos && { backgroundColor: '#E0E7FF' }]}
          onPress={toggleTodos}
        >
          <Text style={[styles.filterChipText, todosActivos && { color: '#3730A3' }]}>
            Todos
          </Text>
        </TouchableOpacity>

        {(Object.keys(typeConfig) as EventType[]).map(type => (
          <TouchableOpacity
            key={type}
            style={[styles.filterChip, filtros[type] && !todosActivos && { backgroundColor: typeConfig[type].bg }]}
            onPress={() => toggleFiltro(type)}
          >
            <Text style={[styles.filterChipText, filtros[type] && !todosActivos && { color: typeConfig[type].color }]}>
              {typeConfig[type].label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* FILTRO FECHA */}
      <View style={styles.dateFilterBar}>
        <Text style={styles.dateFilterLabel}>Filtrar por fecha:</Text>
        {Platform.OS === 'web' ? (
          <input
            type="date"
            value={fechaFiltro}
            onChange={e => setFechaFiltro(e.target.value)}
            style={{
              backgroundColor: '#F3F4F6', borderRadius: 8, padding: 6,
              fontSize: 13, color: '#111827', border: 'none', outline: 'none',
            }}
          />
        ) : (
          <TouchableOpacity onPress={() => setFechaFiltro('')}>
            <Text style={styles.dateFilterValue}>{fechaFiltro || 'Todas'}</Text>
          </TouchableOpacity>
        )}
        {fechaFiltro ? (
          <TouchableOpacity onPress={() => setFechaFiltro('')}>
            <Text style={styles.clearBtn}>✕ Limpiar</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No hay eventos que coincidan.</Text>
          </View>
        ) : (
          filtered.map((event, index) => {
            const config = typeConfig[event.type];
            return (
              <View key={index} style={styles.card}>
                <View style={[styles.badge, { backgroundColor: config.bg }]}>
                  <Text style={[styles.badgeText, { color: config.color }]}>{config.label}</Text>
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.cardMessage}>{event.message}</Text>
                  <Text style={styles.cardTime}>
                    {event.timestamp.toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  filterBar: { flexDirection: 'row', gap: 8, padding: 16, paddingBottom: 8, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', flexWrap: 'wrap' },
  filterChip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, backgroundColor: '#F3F4F6' },
  filterChipText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  dateFilterBar: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  dateFilterLabel: { fontSize: 13, color: '#6B7280' },
  dateFilterValue: { fontSize: 13, color: '#111827', fontWeight: '600' },
  clearBtn: { fontSize: 12, color: '#EF4444', fontWeight: '600' },
  content: { padding: 16, gap: 10 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 15, color: '#9CA3AF' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  badge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 20 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  cardBody: { flex: 1 },
  cardMessage: { fontSize: 14, color: '#111827', fontWeight: '500' },
  cardTime: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
});