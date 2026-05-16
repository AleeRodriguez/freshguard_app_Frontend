import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../config/firebase';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { getUsuarioPorUid, crearUsuario } from '../services/usuariosService';
import { useAuth } from '../context/AuthContext';
import Svg, { Path, Line, Rect, Text as SvgText } from 'react-native-svg';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Login'>;
};

function FreshGuardLogo() {
  return (
    <Svg width="260" height="120" viewBox="0 0 680 300">
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

export default function LoginScreen({ navigation }: Props) {
  const { setUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) {
      setError('Completa todos los campos.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const uid = credential.user.uid;
      let usuario = await getUsuarioPorUid(uid);

      if (!usuario) {
        usuario = await crearUsuario({
          uid,
          nombre: email.split('@')[0],
          email,
          rol: 'encargado',
        });
      }

      if (!usuario.activo) {
        setError('Tu cuenta está desactivada. Contacta al encargado.');
        setLoading(false);
        return;
      }

      setUser({
        uid: usuario.uid,
        email: usuario.email,
        nombre: usuario.nombre,
        rol: usuario.rol,
      });

      navigation.replace('Main');
    } catch (e: any) {
      switch (e.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          setError('Email o contraseña incorrectos.');
          break;
        case 'auth/invalid-email':
          setError('Email inválido.');
          break;
        case 'auth/too-many-requests':
          setError('Demasiados intentos. Intentá más tarde.');
          break;
        default:
          setError('Error al iniciar sesión. Intentá de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword() {
    if (!email) {
      setError('Ingresá tu email para restablecer la contraseña.');
      return;
    }
    setResetLoading(true);
    setError('');
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
    } catch (e: any) {
      switch (e.code) {
        case 'auth/user-not-found':
          setError('No existe una cuenta con ese email.');
          break;
        case 'auth/invalid-email':
          setError('Email inválido.');
          break;
        default:
          setError('Error al enviar el email. Intentá de nuevo.');
      }
    } finally {
      setResetLoading(false);
    }
  }

  return (
    <View style={styles.container}>

      {/* Logo SVG */}
      <View style={styles.logoContainer}>
        <FreshGuardLogo />
        <Text style={styles.logoSub}>Gestión de inventario</Text>
      </View>

      <Text style={styles.title}>Iniciar Sesión</Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={text => { setEmail(text); setResetSent(false); setError(''); }}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor="#9CA3AF"
        />
        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholderTextColor="#9CA3AF"
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {resetSent ? <Text style={styles.success}>✓ Email enviado. Revisá tu casilla.</Text> : null}

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

        {/* Reset contraseña */}
        <TouchableOpacity
          style={styles.resetBtn}
          onPress={handleResetPassword}
          disabled={resetLoading}
        >
          {resetLoading
            ? <ActivityIndicator color="#6B7280" size="small" />
            : <Text style={styles.resetText}>¿Olvidaste tu contraseña?</Text>
          }
        </TouchableOpacity>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 24, justifyContent: 'center' },
  logoContainer: { alignItems: 'center', marginBottom: 32 },
  logoSub: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#111827', marginBottom: 24 },
  form: { gap: 12 },
  input: { backgroundColor: '#F3F4F6', borderRadius: 10, padding: 14, fontSize: 16, color: '#111827' },
  error: { color: '#EF4444', fontSize: 14 },
  success: { color: '#10B981', fontSize: 14 },
  button: { backgroundColor: '#111827', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  resetBtn: { alignItems: 'center', paddingVertical: 8 },
  resetText: { color: '#6B7280', fontSize: 14 },
});