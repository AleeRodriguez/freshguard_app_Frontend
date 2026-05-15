import { View, Image, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Splash'>;
};

export default function SplashScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Text style={styles.logo}>FreshGuard</Text>
      </View>
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Login')}>
        <Text style={styles.buttonText}>Login →</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', justifyContent: 'space-between', padding: 24 },
  logoContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  logo: { fontSize: 36, fontWeight: 'bold', color: '#111827' },
  button: { paddingVertical: 16 },
  buttonText: { fontSize: 18, fontWeight: '600', color: '#111827' },
});