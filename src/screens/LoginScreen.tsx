import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { getUsuarioPorUid, crearUsuario } from '../services/usuariosService';
import { useAuth } from '../context/AuthContext';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Login'>;
};

export default function LoginScreen({ navigation }: Props) {
  const { setUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
  if (!email || !password) {
    setError('Completa todos los campos.');
    return;
  }
  setLoading(true);
  setError('');
  try {
    console.log('Intentando login con:', email);
    const credential = await signInWithEmailAndPassword(auth, email, password);
    console.log('Firebase OK, uid:', credential.user.uid);
    
    const uid = credential.user.uid;
    console.log('Buscando usuario en DB...');
    let usuario = await getUsuarioPorUid(uid);
    console.log('Usuario encontrado:', usuario);
    
    if (!usuario) {
      console.log('Creando usuario nuevo...');
      usuario = await crearUsuario({
        uid,
        nombre: email.split('@')[0],
        email,
        rol: 'encargado',
      });
      console.log('Usuario creado:', usuario);
    }

      // Verificar si está activo
      if (!usuario.activo) {
        setError('Tu cuenta está desactivada. Contacta al encargado.');
        setLoading(false);
        return;
      }

      // Guardar en el contexto
      setUser({
        uid: usuario.uid,
        email: usuario.email,
        nombre: usuario.nombre,
        rol: usuario.rol,
      });

      navigation.replace('Main');
    } catch (e: any) {
  console.log('Error code:', e.code);
  console.log('Error message:', e.message);
  console.log('Error completo:', JSON.stringify(e));
  switch (e.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          setError('Email o contraseña incorrectos.');
          break;
        case 'auth/invalid-email':
          setError('Email invalido.');
          break;
        case 'auth/too-many-requests':
          setError('Demasiados intentos. Intenta mas tarde.');
          break;
        default:
          setError('Error al iniciar sesion. Intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Text style={styles.logo}>FreshGuard</Text>
        <Text style={styles.logoSub}>Gestion de inventario</Text>
      </View>

      <Text style={styles.title}>Iniciar Sesion</Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor="#9CA3AF"
        />
        <TextInput
          style={styles.input}
          placeholder="Contrasena"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholderTextColor="#9CA3AF"
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.button, loading && { opacity: 0.7 }]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>Ingresar</Text>
          }
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 24, justifyContent: 'center' },
  logoContainer: { alignItems: 'center', marginBottom: 40 },
  logo: { fontSize: 36, fontWeight: 'bold', color: '#111827' },
  logoSub: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#111827', marginBottom: 24 },
  form: { gap: 12 },
  input: { backgroundColor: '#F3F4F6', borderRadius: 10, padding: 14, fontSize: 16, color: '#111827' },
  error: { color: '#EF4444', fontSize: 14 },
  button: { backgroundColor: '#111827', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});