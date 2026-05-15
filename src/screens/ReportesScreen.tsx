import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useState } from 'react';
import { useProductos } from '../context/ProductosContext';
import { EventoReporte, EventType } from '../types/index';

const typeConfig: Record<EventType, { label: string; color: string; bg: string }> = {
  added: { label: 'Agregado', color: '#065F46', bg: '#D1FAE5' },
  expired: { label: 'Vencido', color: '#991B1B', bg: '#FEE2E2' },
  expiring: { label: 'Por vencer', color: '#92400E', bg: '#FEF3C7' },
};

export default function ReportesScreen() {
  const { eventLog, products } = useProductos();
  const [filtros, setFiltros] = useState<Record<EventType, boolean>>({
    added: true, expired: true, expiring: true,
  });
  const [eventoSeleccionado, setEventoSeleccionado] = useState<EventoReporte | null>(null);

  function toggleFiltro(type: EventType) {
    setFiltros(prev => ({ ...prev, [type]: !prev[type] }));
  }

  function toggleTodos() {
    const todosActivos = Object.values(filtros).every(v => v);
    setFiltros({ added: !todosActivos, expired: !todosActivos, expiring: !todosActivos });
  }

  const todosActivos = Object.values(filtros).every(v => v);

  const filtered = [...eventLog]
    .filter(e => filtros[e.type])
    .sort((a, b) => {
      const ta = a.timestamp instanceof Date ? a.timestamp : new Date(a.timestamp);
      const tb = b.timestamp instanceof Date ? b.timestamp : new Date(b.timestamp);
      return tb.getTime() - ta.getTime();
    });

  return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>

      {/* FILTROS */}
      <View style={styles.filterBar}>
        <TouchableOpacity
          style={[styles.filterChip, todosActivos && styles.filterChipActive]}
          onPress={toggleTodos}
        >
          <Text style={[styles.filterChipText, todosActivos && styles.filterChipTextActive]}>
            Todos
          </Text>
        </TouchableOpacity>

        {(Object.keys(typeConfig) as EventType[]).map(type => (
          <TouchableOpacity
            key={type}
            style={[styles.filterChip, filtros[type] && { backgroundColor: typeConfig[type].bg }]}
            onPress={() => toggleFiltro(type)}
          >
            <Text style={[styles.filterChipText, filtros[type] && { color: typeConfig[type].color }]}>
              {typeConfig[type].label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* LISTA */}
      <ScrollView contentContainerStyle={styles.content}>
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No hay eventos que coincidan.</Text>
          </View>
        ) : (
          filtered.map((event, index) => {
            const config = typeConfig[event.type];
            const ts = event.timestamp instanceof Date ? event.timestamp : new Date(event.timestamp);
            return (
              <TouchableOpacity key={index} style={styles.card} onPress={() => setEventoSeleccionado(event)}>
                <View style={[styles.badge, { backgroundColor: config.bg }]}>
                  <Text style={[styles.badgeText, { color: config.color }]}>{config.label}</Text>
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.cardMessage}>{event.message}</Text>
                  <Text style={styles.cardTime}>
                    {ts.toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                <Text style={styles.cardArrow}>›</Text>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* MODAL DETALLE */}
      <Modal visible={!!eventoSeleccionado} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {eventoSeleccionado && (() => {
              const config = typeConfig[eventoSeleccionado.type];
              const ts = eventoSeleccionado.timestamp instanceof Date
                ? eventoSeleccionado.timestamp
                : new Date(eventoSeleccionado.timestamp);
              const producto = eventoSeleccionado.productId
                ? products.find(p => p.id === eventoSeleccionado.productId)
                : null;
              return (
                <>
                  <View style={[styles.modalBadge, { backgroundColor: config.bg }]}>
                    <Text style={[styles.modalBadgeText, { color: config.color }]}>{config.label}</Text>
                  </View>
                  <Text style={styles.modalTitle}>{eventoSeleccionado.message}</Text>

                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>👤 Usuario</Text>
                    <Text style={styles.modalValue}>{eventoSeleccionado.usuarioNombre}</Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>📅 Fecha y hora</Text>
                    <Text style={styles.modalValue}>
                      {ts.toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>

                  {producto && (
                    <>
                      <View style={styles.modalRow}>
                        <Text style={styles.modalLabel}>📦 Producto</Text>
                        <Text style={styles.modalValue}>{producto.nombre} {producto.marca}</Text>
                      </View>
                      <View style={styles.modalRow}>
                        <Text style={styles.modalLabel}>🔢 Cantidad</Text>
                        <Text style={styles.modalValue}>{producto.cantidad} paquetes</Text>
                      </View>
                      <View style={styles.modalRow}>
                        <Text style={styles.modalLabel}>⚖️ Peso unitario</Text>
                        <Text style={styles.modalValue}>{Number(producto.peso).toFixed(2)} kg. c/u</Text>
                      </View>
                      <View style={styles.modalRow}>
                        <Text style={styles.modalLabel}>📊 Peso total</Text>
                        <Text style={styles.modalValue}>{(Number(producto.peso) * Number(producto.cantidad)).toFixed(2)} kg.</Text>
                      </View>
                      <View style={styles.modalRow}>
                        <Text style={styles.modalLabel}>⏰ Vencimiento</Text>
                        <Text style={styles.modalValue}>{producto.fechaVencimiento.split('-').reverse().join('/')}</Text>
                      </View>
                    </>
                  )}

                  <TouchableOpacity style={styles.closeBtn} onPress={() => setEventoSeleccionado(null)}>
                    <Text style={styles.closeBtnText}>Cerrar</Text>
                  </TouchableOpacity>
                </>
              );
            })()}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  filterBar: { flexDirection: 'row', gap: 8, padding: 16, paddingBottom: 8, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', flexWrap: 'wrap' },
  filterChip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, backgroundColor: '#F3F4F6' },
  filterChipActive: { backgroundColor: '#E0E7FF' },
  filterChipText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  filterChipTextActive: { color: '#3730A3' },
  content: { padding: 16, gap: 10 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 15, color: '#9CA3AF' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  cardArrow: { fontSize: 20, color: '#9CA3AF' },
  badge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 20 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  cardBody: { flex: 1 },
  cardMessage: { fontSize: 14, color: '#111827', fontWeight: '500' },
  cardTime: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 12 },
  modalBadge: { alignSelf: 'flex-start', paddingVertical: 4, paddingHorizontal: 12, borderRadius: 20 },
  modalBadgeText: { fontSize: 13, fontWeight: '700' },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  modalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  modalLabel: { fontSize: 14, color: '#6B7280' },
  modalValue: { fontSize: 14, color: '#111827', fontWeight: '500', textAlign: 'right', flex: 1, marginLeft: 12 },
  closeBtn: { backgroundColor: '#111827', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 8 },
  closeBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});