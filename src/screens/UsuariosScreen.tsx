import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, secondaryAuth } from '../config/firebase';
import { getUsuarios, crearUsuario, actualizarUsuario, UsuarioAPI } from '../services/usuariosService';

export default function UsuariosScreen() {
  const [usuarios, setUsuarios] = useState<UsuarioAPI[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState<'encargado' | 'empleado'>('empleado');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    cargarUsuarios();
  }, []);

  async function cargarUsuarios() {
    try {
      setLoading(true);
      const data = await getUsuarios();
      setUsuarios(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCrearUsuario() {
    if (!nombre || !email || !password) {
      setError('Completa todos los campos.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const credential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
      await crearUsuario({
        uid: credential.user.uid,
        nombre,
        email,
        rol,
      });
      setSuccess(`Usuario ${nombre} creado correctamente.`);
      setNombre(''); setEmail(''); setPassword(''); setRol('empleado');
      setShowForm(false);
      await cargarUsuarios();
      setTimeout(() => setSuccess(''), 3000);
    } catch (e: any) {
      if (e.code === 'auth/email-already-in-use') {
        setError('El email ya esta en uso.');
      } else {
        setError('Error al crear usuario.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function toggleActivo(usuario: UsuarioAPI) {
    try {
      await actualizarUsuario(usuario.uid, { activo: !usuario.activo });
      await cargarUsuarios();
    } catch {
      Alert.alert('Error', 'No se pudo actualizar el usuario.');
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <ScrollView contentContainerStyle={styles.content}>

        {success ? (
          <View style={styles.successBanner}>
            <Text style={styles.successText}>✓ {success}</Text>
          </View>
        ) : null}

        <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm(!showForm)}>
          <Text style={styles.addBtnText}>{showForm ? '✕ Cancelar' : '+ Crear nuevo usuario'}</Text>
        </TouchableOpacity>

        {showForm && (
          <View style={styles.form}>
            <Text style={styles.formTitle}>Nuevo usuario</Text>

            <Text style={styles.label}>Nombre</Text>
            <TextInput style={styles.input} value={nombre} onChangeText={setNombre} placeholder="Ej: Juan Lopez" />

            <Text style={styles.label}>Email</Text>
            <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="Ej: juan@ugis.com" keyboardType="email-address" autoCapitalize="none" />

            <Text style={styles.label}>Contrasena</Text>
            <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="Min 6 caracteres" secureTextEntry />

            <Text style={styles.label}>Rol</Text>
            <View style={styles.rolRow}>
              <TouchableOpacity
                style={[styles.rolBtn, rol === 'empleado' && styles.rolBtnActive]}
                onPress={() => setRol('empleado')}
              >
                <Text style={[styles.rolBtnText, rol === 'empleado' && styles.rolBtnTextActive]}>Empleado</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.rolBtn, rol === 'encargado' && styles.rolBtnActive]}
                onPress={() => setRol('encargado')}
              >
                <Text style={[styles.rolBtnText, rol === 'encargado' && styles.rolBtnTextActive]}>Encargado</Text>
              </TouchableOpacity>
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity style={styles.saveBtn} onPress={handleCrearUsuario} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Crear usuario</Text>}
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.sectionTitle}>Usuarios registrados</Text>

        {loading && !showForm ? (
          <ActivityIndicator size="large" color="#111827" style={{ marginTop: 40 }} />
        ) : (
          usuarios.map(u => (
            <View key={u.uid} style={styles.card}>
              <View style={styles.cardInfo}>
                <Text style={styles.cardName}>{u.nombre}</Text>
                <Text style={styles.cardEmail}>{u.email}</Text>
                <View style={styles.badgeRow}>
                  <View style={[styles.badge, u.rol === 'encargado' ? styles.badgeEncargado : styles.badgeEmpleado]}>
                    <Text style={styles.badgeText}>{u.rol}</Text>
                  </View>
                  <View style={[styles.badge, u.activo ? styles.badgeActivo : styles.badgeInactivo]}>
                    <Text style={styles.badgeText}>{u.activo ? 'Activo' : 'Inactivo'}</Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.toggleBtn, u.activo ? styles.toggleBtnDesactivar : styles.toggleBtnActivar]}
                onPress={() => toggleActivo(u)}
              >
                <Text style={styles.toggleBtnText}>{u.activo ? 'Desactivar' : 'Activar'}</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12 },
  successBanner: { backgroundColor: '#D1FAE5', borderRadius: 8, padding: 12 },
  successText: { color: '#065F46', fontWeight: '600' },
  addBtn: { backgroundColor: '#111827', borderRadius: 10, padding: 16, alignItems: 'center' },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  form: { backgroundColor: '#fff', borderRadius: 12, padding: 16, gap: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  formTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 4 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151' },
  input: { backgroundColor: '#F3F4F6', borderRadius: 10, padding: 14, fontSize: 15, color: '#111827' },
  rolRow: { flexDirection: 'row', gap: 8 },
  rolBtn: { flex: 1, padding: 12, borderRadius: 8, backgroundColor: '#F3F4F6', alignItems: 'center' },
  rolBtnActive: { backgroundColor: '#111827' },
  rolBtnText: { fontWeight: '600', color: '#6B7280' },
  rolBtnTextActive: { color: '#fff' },
  error: { color: '#EF4444', fontSize: 13 },
  saveBtn: { backgroundColor: '#4F46E5', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 4 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginTop: 8 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  cardInfo: { flex: 1, gap: 4 },
  cardName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  cardEmail: { fontSize: 13, color: '#6B7280' },
  badgeRow: { flexDirection: 'row', gap: 6, marginTop: 4 },
  badge: { paddingVertical: 2, paddingHorizontal: 8, borderRadius: 20 },
  badgeEncargado: { backgroundColor: '#EDE9FE' },
  badgeEmpleado: { backgroundColor: '#E0F2FE' },
  badgeActivo: { backgroundColor: '#D1FAE5' },
  badgeInactivo: { backgroundColor: '#FEE2E2' },
  badgeText: { fontSize: 11, fontWeight: '600', color: '#374151' },
  toggleBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, marginLeft: 8 },
  toggleBtnDesactivar: { backgroundColor: '#FEE2E2' },
  toggleBtnActivar: { backgroundColor: '#D1FAE5' },
  toggleBtnText: { fontSize: 13, fontWeight: '700', color: '#374151' },
});