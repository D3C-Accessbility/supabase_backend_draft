import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Animated,
  LayoutAnimation,
  UIManager,
  Platform,
  StyleSheet,
  FlatList,
} from 'react-native';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BusLine {
  id: string;
  name: string;
  color: string;
}

export interface ScheduledRoute {
  id: string;
  time: string;          // "HH:mm"
  daysOfWeek: number[];  // 0=Sun, 1=Mon … 6=Sat
  from?: string;
  to?: string;
  lineId?: string;
  frequency?: string;
}

interface WeeklyScheduleProps {
  busLines: BusLine[];
  schedules: ScheduledRoute[];
  onAddSchedule?: (schedule: ScheduledRoute) => void;
  onDeleteSchedule: (id: string) => void;
  onToggleSchedule?: (id: string, enabled: boolean) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
  { value: 0, label: 'Sun' },
];

const TIME_SLOTS = Array.from({ length: 15 }, (_, i) => i + 7); // 7 AM – 9 PM

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatHour(hour: number) {
  if (hour === 12) return '12 PM';
  return hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
}

function ampm(timeStr: string) {
  return parseInt(timeStr.split(':')[0]) >= 12 ? 'PM' : 'AM';
}

// ─── Tab Switcher ─────────────────────────────────────────────────────────────

function TabSwitcher({
  active,
  onChange,
}: {
  active: 'list' | 'grid';
  onChange: (tab: 'list' | 'grid') => void;
}) {
  return (
    <View style={styles.tabContainer}>
      {(['list', 'grid'] as const).map(tab => (
        <TouchableOpacity
          key={tab}
          onPress={() => onChange(tab)}
          style={[styles.tabButton, active === tab && styles.tabButtonActive]}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, active === tab && styles.tabTextActive]}>
            {tab.toUpperCase()}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── Schedule Card (List View) ────────────────────────────────────────────────

function ScheduleCard({
  schedule,
  color,
  onDelete,
}: {
  schedule: ScheduledRoute;
  color: string;
  onDelete: () => void;
}) {
  return (
    <View style={styles.card}>
      {/* Time column */}
      <View style={styles.timeColumn}>
        <Text style={styles.timeIcon}>⏱</Text>
        <Text style={styles.timeHour}>{schedule.time.split(':')[0]}</Text>
        <Text style={styles.timeAmpm}>{ampm(schedule.time)}</Text>
      </View>

      {/* Content */}
      <View style={styles.cardContent}>
        {/* Top row: frequency badge + day dots + delete */}
        <View style={styles.cardTopRow}>
          <View style={styles.cardTopLeft}>
            {schedule.frequency && (
              <View style={styles.frequencyBadge}>
                <Text style={styles.frequencyText}>🔁 {schedule.frequency}</Text>
              </View>
            )}
            <View style={styles.dayDots}>
              {schedule.daysOfWeek.map(d => (
                <View key={d} style={styles.dayDot}>
                  <Text style={styles.dayDotText}>
                    {DAYS.find(day => day.value === d)?.label.charAt(0)}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <TouchableOpacity
            onPress={onDelete}
            style={styles.deleteButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.deleteIcon}>🗑</Text>
          </TouchableOpacity>
        </View>

        {/* Route: from → to */}
        <View style={styles.routeRow}>
          <Text style={styles.routeText} numberOfLines={1}>
            {schedule.from || 'Start'}
          </Text>
          <Text style={styles.arrowText}> → </Text>
          <Text style={styles.routeText} numberOfLines={1}>
            {schedule.to || 'Destination'}
          </Text>
        </View>

        {/* Color accent bar */}
        <View style={[styles.accentBar, { backgroundColor: color }]} />
      </View>
    </View>
  );
}

// ─── Grid View ────────────────────────────────────────────────────────────────

function GridView({ schedules }: { schedules: ScheduledRoute[] }) {
  const getScheduleForDayAndTime = (day: number, hour: number) =>
    schedules.filter(s => {
      const h = parseInt(s.time.split(':')[0]);
      return s.daysOfWeek.includes(day) && h === hour;
    });

  const CELL_W = 80;
  const TIME_COL_W = 56;

  return (
    <View style={styles.gridWrapper}>
      {/* Outer horizontal scroll */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ width: TIME_COL_W + CELL_W * 7 }}>
          {/* Header row */}
          <View style={styles.gridHeaderRow}>
            <View style={[styles.gridTimeCell, { width: TIME_COL_W }]} />
            {DAYS.map(day => (
              <View key={day.value} style={[styles.gridHeaderCell, { width: CELL_W }]}>
                <Text style={styles.gridHeaderText}>{day.label}</Text>
              </View>
            ))}
          </View>

          {/* Body – vertical scroll inside */}
          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 480 }}>
            {TIME_SLOTS.map(hour => (
              <View key={hour} style={styles.gridBodyRow}>
                {/* Time label */}
                <View style={[styles.gridTimeCell, { width: TIME_COL_W }]}>
                  <Text style={styles.gridTimeText}>{formatHour(hour)}</Text>
                </View>

                {/* Day cells */}
                {DAYS.map(day => {
                  const items = getScheduleForDayAndTime(day.value, hour);
                  return (
                    <View key={`${day.value}-${hour}`} style={[styles.gridCell, { width: CELL_W }]}>
                      {items.map(s => (
                        <View key={s.id} style={styles.gridChip}>
                          <Text style={styles.gridChipTo} numberOfLines={1}>{s.to}</Text>
                          <Text style={styles.gridChipTime}>{s.time}</Text>
                        </View>
                      ))}
                    </View>
                  );
                })}
              </View>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function WeeklySchedule({
  busLines,
  schedules,
  onDeleteSchedule,
}: WeeklyScheduleProps) {
  const [activeTab, setActiveTab] = useState<'list' | 'grid'>('list');

  const handleTabChange = (tab: 'list' | 'grid') => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveTab(tab);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ── */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIcon}>
            <Text style={{ fontSize: 20 }}>📅</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>My Schedule</Text>
            <Text style={styles.headerSubtitle}>Weekly Routine</Text>
          </View>
        </View>
        <TabSwitcher active={activeTab} onChange={handleTabChange} />
      </View>

      {/* ── List View ── */}
      {activeTab === 'list' && (
        <View style={styles.listContainer}>
          {schedules.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📅</Text>
              <Text style={styles.emptyTitle}>No scheduled trips yet</Text>
              <Text style={styles.emptySubtitle}>Start a route to add it here</Text>
            </View>
          ) : (
            schedules.map(schedule => {
              const line = schedule.lineId
                ? busLines.find(l => l.id === schedule.lineId)
                : null;
              const color = line?.color || '#3b82f6';
              return (
                <ScheduleCard
                  key={schedule.id}
                  schedule={schedule}
                  color={color}
                  onDelete={() => onDeleteSchedule(schedule.id)}
                />
              );
            })
          )}
        </View>
      )}

      {/* ── Grid View ── */}
      {activeTab === 'grid' && <GridView schedules={schedules} />}
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 96,
    gap: 20,
  },

  // Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#111827',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },

  // Tab switcher
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 4,
    gap: 2,
  },
  tabButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
    color: '#9ca3af',
  },
  tabTextActive: {
    color: '#2563eb',
  },

  // List container
  listContainer: {
    gap: 12,
  },

  // Schedule card
  card: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#f3f4f6',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  timeColumn: {
    width: 72,
    backgroundColor: '#f9fafb',
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#f3f4f6',
    paddingVertical: 16,
    gap: 2,
  },
  timeIcon: {
    fontSize: 14,
    marginBottom: 2,
  },
  timeHour: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111827',
    lineHeight: 24,
  },
  timeAmpm: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cardContent: {
    flex: 1,
    padding: 14,
    gap: 8,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTopLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  frequencyBadge: {
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  frequencyText: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#6b7280',
  },
  dayDots: {
    flexDirection: 'row',
    gap: 4,
    flexWrap: 'wrap',
  },
  dayDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayDotText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#2563eb',
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteIcon: {
    fontSize: 15,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  routeText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
    flexShrink: 1,
  },
  arrowText: {
    fontSize: 13,
    color: '#9ca3af',
    fontWeight: '700',
  },
  accentBar: {
    height: 3,
    borderRadius: 99,
    marginTop: 4,
    opacity: 0.7,
  },

  // Empty state
  emptyState: {
    paddingVertical: 48,
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
    gap: 6,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#9ca3af',
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#9ca3af',
  },

  // Grid
  gridWrapper: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#f3f4f6',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  gridHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    borderBottomWidth: 1.5,
    borderBottomColor: '#f3f4f6',
  },
  gridHeaderCell: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderLeftColor: '#f3f4f6',
  },
  gridHeaderText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  gridBodyRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f9fafb',
    minHeight: 72,
  },
  gridTimeCell: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 8,
    backgroundColor: '#f9fafb',
    borderRightWidth: 1.5,
    borderRightColor: '#f3f4f6',
  },
  gridTimeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  gridCell: {
    padding: 4,
    borderLeftWidth: 1,
    borderLeftColor: '#f9fafb',
    gap: 3,
  },
  gridChip: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    padding: 5,
    gap: 2,
  },
  gridChipTo: {
    fontSize: 8,
    fontWeight: '900',
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  gridChipTime: {
    fontSize: 8,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.8)',
  },
});
