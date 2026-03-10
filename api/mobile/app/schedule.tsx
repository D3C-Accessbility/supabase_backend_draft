import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WeeklySchedule } from '../WeeklySchedule';

const MOCK_BUS_LINES = [
  { id: '1', name: 'Line 1', color: '#3b82f6' },
  { id: '2', name: 'Line 2', color: '#10b981' },
];

const MOCK_SCHEDULES = [
  { id: 's1', time: '08:30', daysOfWeek: [1, 3, 5], from: 'Home', to: 'Office', lineId: '1', frequency: 'Weekly' },
  { id: 's2', time: '17:00', daysOfWeek: [1, 2, 3, 4, 5], from: 'Office', to: 'Home', lineId: '2' },
];

export default function SchedulePage() {
  return (
    <SafeAreaView style={styles.container}>
      <WeeklySchedule
        busLines={MOCK_BUS_LINES}
        schedules={MOCK_SCHEDULES}
        onDeleteSchedule={(id) => console.log('Delete', id)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
});