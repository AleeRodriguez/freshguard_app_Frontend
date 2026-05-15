import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CameraView, Camera } from 'expo-camera';

let lastScanTime = 0;

interface Props {
  onScanned: (barcode: string) => void;
  onClose: () => void;
}

export default function ScannerScreen({ onScanned, onClose }: Props) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [active, setActive] = useState(true);

  useEffect(() => {
    lastScanTime = 0;
    Camera.requestCameraPermissionsAsync().then(({ status }) => {
      setHasPermission(status === 'granted');
    });
  }, []);

  function handleBarcode(data: string) {
  const now = Date.now();
  if (now - lastScanTime < 10000) return;
  lastScanTime = now + 99999; // Bloquear inmediatamente con valor futuro
  setActive(false);
  setTimeout(() => onScanned(data), 100);
}
  if (hasPermission === null) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>Solicitando permiso de camara...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>Sin acceso a la camara.</Text>
        <TouchableOpacity style={styles.btn} onPress={onClose}>
          <Text style={styles.btnText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {active && (
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          onBarcodeScanned={({ data }) => handleBarcode(data)}
          barcodeScannerSettings={{
            barcodeTypes: ['ean13', 'ean8', 'code128', 'qr', 'upc_a', 'upc_e', 'code39'],
          }}
        />
      )}

      <View style={styles.overlay}>
        <View style={styles.topOverlay} />
        <View style={styles.middleRow}>
          <View style={styles.sideOverlay} />
          <View style={styles.scanWindow}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
          <View style={styles.sideOverlay} />
        </View>
        <View style={styles.bottomOverlay}>
          <Text style={styles.hint}>Apunta al codigo de barras del producto</Text>
          <Text style={styles.hint2}>Asegurate de tener buena iluminacion</Text>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const SCAN_SIZE = 250;
const CORNER_SIZE = 24;
const CORNER_WIDTH = 3;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000', gap: 16 },
  text: { color: '#fff', fontSize: 16 },
  btn: { backgroundColor: '#fff', borderRadius: 8, padding: 12, paddingHorizontal: 24 },
  btnText: { color: '#111827', fontWeight: '700' },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between' },
  topOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  middleRow: { flexDirection: 'row', height: SCAN_SIZE },
  sideOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  scanWindow: { width: SCAN_SIZE, height: SCAN_SIZE },
  bottomOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', gap: 12 },
  hint: { color: '#fff', fontSize: 14, opacity: 0.9 },
  hint2: { color: '#fff', fontSize: 12, opacity: 0.6 },
  closeBtn: { backgroundColor: '#fff', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 32, marginTop: 8 },
  closeBtnText: { color: '#111827', fontWeight: '700', fontSize: 16 },
  corner: { position: 'absolute', width: CORNER_SIZE, height: CORNER_SIZE, borderColor: '#fff' },
  topLeft: { top: 0, left: 0, borderTopWidth: CORNER_WIDTH, borderLeftWidth: CORNER_WIDTH },
  topRight: { top: 0, right: 0, borderTopWidth: CORNER_WIDTH, borderRightWidth: CORNER_WIDTH },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: CORNER_WIDTH, borderLeftWidth: CORNER_WIDTH },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: CORNER_WIDTH, borderRightWidth: CORNER_WIDTH },
});