import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ProductosProvider } from './src/context/ProductosContext';
import { AuthProvider } from './src/context/AuthContext';
import { useEffect } from 'react';
import { registrarNotificaciones } from './src/services/notificaciones';

import SplashScreen from './src/screens/SplashScreen';
import LoginScreen from './src/screens/LoginScreen';
import MainScreen from './src/screens/MainScreen';

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Main: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  useEffect(() => {
    registrarNotificaciones();
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ProductosProvider>
          <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="Splash" component={SplashScreen} />
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Main" component={MainScreen} />
            </Stack.Navigator>
          </NavigationContainer>
        </ProductosProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}