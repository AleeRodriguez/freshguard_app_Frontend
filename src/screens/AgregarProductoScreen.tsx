import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Platform, Alert } from 'react-native';
import { useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useProductos } from '../context/ProductosContext';
import ScannerScreen from './ScannerScreen';
import { buscarProductoPorBarcode, buscarEnInventarioPorBarcode } from '../services/productosService';


function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function displayDate(dateStr: string): string {
  if (!dateStr) return 'Seleccionar fecha';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

export default function AgregarProductoScreen() {
  const { addProduct, products, updateProductQuantity } = useProductos();
  const [nombre, setNombre] = useState('');
  const [marca, setMarca] = useState('');
  const [categoria, setCategoria] = useState('');
  const [codigoBarras, setCodigoBarras] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [peso, setPeso] = useState('');
  const [fechaIngreso, setFechaIngreso] = useState('');
  const [fechaVencimiento, setFechaVencimiento] = useState('');
  const [showIngresoPicker, setShowIngresoPicker] = useState(false);
  const [showVencimientoPicker, setShowVencimientoPicker] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [success, setSuccess] = useState(false);
  const [scanMessage, setScanMessage] = useState('');
  const [scanSuccess, setScanSuccess] = useState(false);

  async function handleAdd() {
  if (!nombre || !fechaVencimiento) {
    setScanMessage('❌ Completa el nombre y la fecha de vencimiento.');
    setScanSuccess(false);
    return;
  }
  // Validación de fechas
const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
const ingreso = new Date((fechaIngreso || formatDate(new Date())) + 'T00:00:00');
const vencimiento = new Date(fechaVencimiento + 'T00:00:00');

if (vencimiento < hoy) {
  setScanMessage('❌ La fecha de vencimiento no puede ser anterior a hoy.');
  setScanSuccess(false);
  return;
}

if (vencimiento <= ingreso) {
  setScanMessage('❌ La fecha de vencimiento debe ser posterior a la fecha de ingreso.');
  setScanSuccess(false);
  return;
}

  const loteExistente = products.find(p =>
    p.nombre.trim().toLowerCase() === nombre.trim().toLowerCase() &&
    p.marca.trim().toLowerCase() === marca.trim().toLowerCase() &&
    p.fechaVencimiento === fechaVencimiento
  );

  if (loteExistente) {
    await updateProductQuantity(loteExistente.id, loteExistente.cantidad + (parseFloat(cantidad) || 1));
    setScanMessage('✅ Cantidad sumada al lote existente.');
    setScanSuccess(true);
  } else {
  await addProduct({
    nombre, marca, categoria, codigoBarras,
    cantidad: parseFloat(cantidad) || 1,
    peso: parseFloat(peso) || 0,
    fechaIngreso: fechaIngreso || formatDate(new Date()),
    fechaVencimiento,
    expiredNotified: false,
    expiringNotified: false,
  });
  Alert.alert(
    '✅ Producto agregado',
    `${nombre} fue cargado correctamente al inventario.`,
    [{ text: 'OK' }]
  );
  setScanMessage('');
}

  setNombre(''); setMarca(''); setCategoria(''); setCodigoBarras('');
  setCantidad(''); setPeso(''); setFechaIngreso(''); setFechaVencimiento('');
  setTimeout(() => { setSuccess(false); setScanMessage(''); setScanSuccess(false); }, 3000);
}

  async function handleScanned(barcode: string) {
    setShowScanner(false);
    setScanMessage('');
    setScanSuccess(false);

    await new Promise(resolve => setTimeout(resolve, 300));

    try {
      const enInventario = await buscarEnInventarioPorBarcode(barcode);
      if (enInventario) {
        setNombre(enInventario.nombre);
        setMarca(enInventario.marca);
        setCategoria(enInventario.categoria || '');
        setCodigoBarras(barcode);
        setScanSuccess(true);
        setScanMessage(`✅ ${enInventario.nombre} - ${enInventario.marca}`);
        return;
      }

      const enAPI = await buscarProductoPorBarcode(barcode);
      if (enAPI && enAPI.nombre) {
        setNombre(enAPI.nombre);
        setMarca(enAPI.marca);
        setCategoria(enAPI.categoria);
        setCodigoBarras(barcode);
        setScanSuccess(true);
        setScanMessage(`✅ ${enAPI.nombre} - ${enAPI.marca}`);
        return;
      }

      setCodigoBarras(barcode);
      setScanSuccess(false);
      setScanMessage('⚠️ Producto no encontrado. Completa los datos manualmente — quedara guardado para la proxima.');
    } catch {
      setScanMessage('❌ Error al consultar la base de datos.');
    }
  }

  const DateField = ({
    label, value, showPicker, setShowPicker, onChange
  }: {
    label: string;
    value: string;
    showPicker: boolean;
    setShowPicker: (v: boolean) => void;
    onChange: (v: string) => void;
  }) => (
    <>
      <Text style={styles.label}>{label}</Text>
      {Platform.OS === 'web' ? (
        <input
          type="date"
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{
            backgroundColor: '#F3F4F6', borderRadius: 10, padding: 14,
            fontSize: 15, color: value ? '#111827' : '#9CA3AF',
            border: 'none', width: '100%', fontFamily: 'inherit', outline: 'none',
          }}
        />
      ) : (
        <>
          <TouchableOpacity style={styles.dateButton} onPress={() => setShowPicker(true)}>
            <Text style={[styles.dateButtonText, !value && { color: '#9CA3AF' }]}>
              {displayDate(value)}
            </Text>
            <Text style={styles.dateIcon}>📅</Text>
          </TouchableOpacity>
          {showPicker && (
            <DateTimePicker
              value={value ? new Date(value + 'T00:00:00') : new Date()}
              mode="date"
              display="default"
              onChange={(_, date) => {
                setShowPicker(false);
                if (date) onChange(formatDate(date));
              }}
            />
          )}
        </>
      )}
    </>
  );

  if (showScanner) {
    return (
      <ScannerScreen
        onScanned={handleScanned}
        onClose={() => setShowScanner(false)}
      />
    );
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.subtitle}>Carga un nuevo producto al inventario.</Text>

      {success && (
        <View style={styles.successBanner}>
          <Text style={styles.successText}>✓ Producto agregado correctamente.</Text>
        </View>
      )}

      {scanMessage ? (
        <View style={[styles.scanBanner, scanSuccess ? styles.scanBannerSuccess : styles.scanBannerWarning]}>
          <Text style={[styles.scanBannerText, scanSuccess ? styles.scanBannerTextSuccess : styles.scanBannerTextWarning]}>
            {scanMessage}
          </Text>
        </View>
      ) : null}

      <TouchableOpacity style={styles.scanButton} onPress={() => setShowScanner(true)}>
        <Text style={styles.scanButtonText}>📷  Escanear codigo de barras</Text>
      </TouchableOpacity>

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>o carga manual</Text>
        <View style={styles.dividerLine} />
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Nombre *</Text>
        <TextInput style={styles.input} value={nombre} onChangeText={setNombre} placeholder="Ej: Harina" />

        <Text style={styles.label}>Marca</Text>
        <TextInput style={styles.input} value={marca} onChangeText={setMarca} placeholder="Ej: Morixe" />

        <Text style={styles.label}>Categoria</Text>
        <TextInput style={styles.input} value={categoria} onChangeText={setCategoria} placeholder="Ej: Lacteos" />

        <Text style={styles.label}>Codigo de barras</Text>
        <TextInput
          style={styles.input}
          value={codigoBarras}
          onChangeText={setCodigoBarras}
          placeholder="Ej: 7790123456789"
          keyboardType="numeric"
        />

        <View style={styles.row}>
          <View style={styles.halfField}>
            <Text style={styles.label}>Cantidad (ud.)</Text>
            <TextInput style={styles.input} value={cantidad} onChangeText={setCantidad} placeholder="0" keyboardType="numeric" />
          </View>
          <View style={styles.halfField}>
            <Text style={styles.label}>Peso (kg.)</Text>
            <TextInput 
  style={styles.input} 
  value={peso} 
  onChangeText={v => setPeso(v.replace(',', '.'))} 
  placeholder="0.00" 
  keyboardType="decimal-pad" 
/>
          </View>
        </View>

        <DateField
          label="Fecha de ingreso"
          value={fechaIngreso}
          showPicker={showIngresoPicker}
          setShowPicker={setShowIngresoPicker}
          onChange={setFechaIngreso}
        />

        <DateField
          label="Fecha de vencimiento *"
          value={fechaVencimiento}
          showPicker={showVencimientoPicker}
          setShowPicker={setShowVencimientoPicker}
          onChange={setFechaVencimiento}
        />

        <TouchableOpacity style={styles.button} onPress={handleAdd}>
          <Text style={styles.buttonText}>+ Agregar producto</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: 24, gap: 4 },
  subtitle: { fontSize: 14, color: '#6B7280', marginBottom: 16 },
  successBanner: { backgroundColor: '#D1FAE5', borderRadius: 8, padding: 12, marginBottom: 8 },
  successText: { color: '#065F46', fontWeight: '600' },
  scanBanner: { borderRadius: 8, padding: 12, marginBottom: 8 },
  scanBannerSuccess: { backgroundColor: '#D1FAE5' },
  scanBannerWarning: { backgroundColor: '#FEF3C7' },
  scanBannerText: { fontWeight: '600', fontSize: 14 },
  scanBannerTextSuccess: { color: '#065F46' },
  scanBannerTextWarning: { color: '#92400E' },
  scanButton: { backgroundColor: '#4F46E5', borderRadius: 10, padding: 16, alignItems: 'center', marginBottom: 8 },
  scanButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 8 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
  dividerText: { fontSize: 12, color: '#9CA3AF' },
  form: { gap: 8 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginTop: 8 },
  input: { backgroundColor: '#F3F4F6', borderRadius: 10, padding: 14, fontSize: 15, color: '#111827' },
  row: { flexDirection: 'row', gap: 12 },
  halfField: { flex: 1 },
  dateButton: { backgroundColor: '#F3F4F6', borderRadius: 10, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dateButtonText: { fontSize: 15, color: '#111827' },
  dateIcon: { fontSize: 18 },
  button: { backgroundColor: '#111827', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 16 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});