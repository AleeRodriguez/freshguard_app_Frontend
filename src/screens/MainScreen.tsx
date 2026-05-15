import { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import { RootStackParamList } from '../../App';
import { useAuth } from '../context/AuthContext';
import DashboardScreen from './DashboardScreen';
import InventarioScreen from './InventarioScreen';
import AgregarProductoScreen from './AgregarProductoScreen';
import ReportesScreen from './ReportesScreen';
import UsuariosScreen from './UsuariosScreen';

type Section = 'dashboard' | 'inventario' | 'agregar' | 'reportes' | 'usuarios';

const sectionTitles: Record<Section, string> = {
  dashboard: 'FreshGuard',
  inventario: 'Inventario',
  agregar: 'Agregar Producto',
  reportes: 'Reportes',
  usuarios: 'Gestion de Usuarios',
};

const sectionIcons: Record<Section, string> = {
  dashboard: '🏠',
  inventario: '📦',
  agregar: '➕',
  reportes: '📋',
  usuarios: '👥',
};

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Main'>;
};

export default function MainScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<Section>('dashboard');
  const [menuOpen, setMenuOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(-280)).current;

  const esEncargado = user?.rol === 'encargado';

  const sections: Section[] = esEncargado
    ? ['dashboard', 'inventario', 'agregar', 'reportes', 'usuarios']
    : ['dashboard', 'inventario', 'agregar', 'reportes'];

  function openMenu() {
    setMenuOpen(true);
    Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start();
  }

  function closeMenu() {
    Animated.timing(slideAnim, { toValue: -280, duration: 300, useNativeDriver: true }).start(() => setMenuOpen(false));
  }

  function navigateTo(section: Section) {
    setActiveSection(section);
    closeMenu();
  }

  async function handleLogout() {
    closeMenu();
    await signOut(auth);
    setTimeout(() => navigation.replace('Login'), 300);
  }

  function renderSection() {
    switch (activeSection) {
      case 'dashboard': return <DashboardScreen />;
      case 'inventario': return <InventarioScreen />;
      case 'agregar': return <AgregarProductoScreen />;
      case 'reportes': return <ReportesScreen />;
      case 'usuarios': return <UsuariosScreen />;
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={openMenu} style={styles.menuBtn}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{sectionTitles[activeSection]}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={{ flex: 1 }}>
        {renderSection()}
      </View>

      {menuOpen && (
        <Pressable style={styles.overlay} onPress={closeMenu} />
      )}

      <Animated.View style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}>
        <View style={styles.sidebarHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{esEncargado ? '👨‍💼' : '👨‍🍳'}</Text>
          </View>
          <Text style={styles.sidebarName}>{user?.nombre || 'Usuario'}</Text>
          <Text style={styles.sidebarRole}>{esEncargado ? 'Encargado' : 'Empleado'} — Pizzeria Ugis</Text>
        </View>

        <View style={styles.menuItems}>
          {sections.map(section => (
            <TouchableOpacity
              key={section}
              style={[styles.menuItem, activeSection === section && styles.menuItemActive]}
              onPress={() => navigateTo(section)}
            >
              <Text style={styles.menuItemIcon}>{sectionIcons[section]}</Text>
              <Text style={[styles.menuItemText, activeSection === section && styles.menuItemTextActive]}>
                {sectionTitles[section]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutIcon}>🚪</Text>
          <Text style={styles.logoutText}>Cerrar sesion</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  menuBtn: { width: 40, height: 40, justifyContent: 'center' },
  menuIcon: { fontSize: 22, color: '#111827' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 40 },
  sidebar: { position: 'absolute', top: 0, left: 0, bottom: 0, width: 280, backgroundColor: '#fff', zIndex: 50, shadowColor: '#000', shadowOffset: { width: 2, height: 0 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 10 },
  sidebarHeader: { backgroundColor: '#111827', padding: 24, paddingTop: 48, alignItems: 'flex-start' },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#374151', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { fontSize: 28 },
  sidebarName: { fontSize: 18, fontWeight: '700', color: '#fff' },
  sidebarRole: { fontSize: 13, color: '#9CA3AF', marginTop: 2 },
  menuItems: { padding: 16, gap: 4, flex: 1 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 12, borderRadius: 8 },
  menuItemActive: { backgroundColor: '#F3F4F6' },
  menuItemIcon: { fontSize: 20 },
  menuItemText: { fontSize: 15, color: '#6B7280', fontWeight: '500' },
  menuItemTextActive: { color: '#111827', fontWeight: '700' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 24, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  logoutIcon: { fontSize: 20 },
  logoutText: { fontSize: 15, color: '#EF4444', fontWeight: '600' },
});