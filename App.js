import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen      from './screens/HomeScreen';
import SettingsScreen  from './screens/SettingsScreen';
import RoutesScreen    from './screens/RoutesScreen';
import ArrivalsScreen  from './screens/ArrivalsScreen';
import AuthScreen      from './screens/AuthScreen';
import SchedulesScreen from './screens/SchedulesScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home"      component={HomeScreen} />
        <Stack.Screen name="Settings"  component={SettingsScreen} />
        <Stack.Screen name="Routes"    component={RoutesScreen} />
        <Stack.Screen name="Arrivals"  component={ArrivalsScreen} />
        <Stack.Screen name="Auth"      component={AuthScreen} />
        <Stack.Screen name="Schedules" component={SchedulesScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}