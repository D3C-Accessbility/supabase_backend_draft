import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RoutesPage } from '../RoutesPage';

const MOCK_BUS_LINES = [
  { id: '1', name: 'Line 1', color: '#3b82f6', pattern: 'dots', stops: [
    { id: 'a', name: 'Central Station' },
    { id: 'b', name: 'City Hall' },
    { id: 'c', name: 'Market St' },
    { id: 'd', name: 'University' },
    { id: 'e', name: 'Airport' },
    { id: 'f', name: 'North Terminal' },
  ]},
  { id: '2', name: 'Line 2', color: '#10b981', pattern: 'stripes', stops: [
    { id: 'g', name: 'South Park' },
    { id: 'h', name: 'Museum' },
    { id: 'i', name: 'Harbor' },
  ]},
];

export default function Index() {
  return (
    <SafeAreaView style={styles.container}>
      <RoutesPage busLines={MOCK_BUS_LINES} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
});