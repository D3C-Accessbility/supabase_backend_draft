import React, { useState, useContext, createContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  SafeAreaView,
  StatusBar,
} from 'react-native';

// ─── Theme Tokens ─────────────────────────────────────────────────────────────
const LIGHT = {
  bg: '#F5F6FA',
  card: '#FFFFFF',
  cardChevronBg: '#F0F2F8',
  inputBg: '#F5F6FA',
  inputBorder: '#E8EAF0',
  divider: '#F0F2F8',
  title: '#1A1A2E',
  subtitle: '#999999',
  label: '#AAAAAA',
  chevron: '#666666',
  tabBar: '#FFFFFF',
  tabIcon: '#999999',
  dropdownActiveItem: '#EEF3FF',
  statusBar: 'dark-content',
};

const DARK = {
  bg: '#0D0D0D',
  card: '#1A1A1A',
  cardChevronBg: '#2A2A2A',
  inputBg: '#222222',
  inputBorder: '#333333',
  divider: '#2A2A2A',
  title: '#F0F0F0',
  subtitle: '#666666',
  label: '#555555',
  chevron: '#AAAAAA',
  tabBar: '#111111',
  tabIcon: '#555555',
  dropdownActiveItem: '#1A2030',
  statusBar: 'light-content',
};

// ─── Theme Context ────────────────────────────────────────────────────────────
const ThemeContext = createContext({ colors: LIGHT, isDark: false });
const useTheme = () => useContext(ThemeContext);

// ─── Toggle Row ───────────────────────────────────────────────────────────────
const ToggleRow = ({ icon, label, subtitle, value, onValueChange, iconColor = '#4F8EF7' }) => {
  const { colors } = useTheme();
  return (
    <View style={styles.toggleRow}>
      <View style={styles.toggleLeft}>
        {icon && (
          <View style={[styles.toggleIcon, { backgroundColor: iconColor + '22' }]}>
            <Text style={{ fontSize: 16 }}>{icon}</Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={[styles.toggleLabel, { color: colors.title }]}>{label}</Text>
          {subtitle ? <Text style={[styles.toggleSubtitle, { color: colors.subtitle }]}>{subtitle}</Text> : null}
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#444', true: '#4F8EF7' }}
        thumbColor="#FFFFFF"
        ios_backgroundColor="#444"
      />
    </View>
  );
};

// ─── Dropdown Row ─────────────────────────────────────────────────────────────
const STOP_OPTIONS = [
  '1 stop away',
  '2 stops away',
  '3 stops away',
  '4 stops away',
  '5 stops away',
];

const DropdownRow = ({ label, value, onValueChange }) => {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.dropdownRow}>
      <Text style={[styles.dropdownLabel, { color: colors.label }]}>{label}</Text>
      <TouchableOpacity
        style={[
          styles.dropdownBox,
          { backgroundColor: colors.inputBg },
          open && {
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
            borderBottomWidth: 1,
            borderBottomColor: colors.inputBorder,
          },
        ]}
        onPress={() => setOpen(!open)}
        activeOpacity={0.8}
      >
        <Text style={[styles.dropdownValue, { color: colors.title }]}>{value}</Text>
        <Text style={[styles.dropdownChevron, { color: colors.chevron }]}>
          {open ? '∧' : '⌄'}
        </Text>
      </TouchableOpacity>

      {open && (
        <View style={[styles.dropdownMenu, { backgroundColor: colors.inputBg }]}>
          {STOP_OPTIONS.map((option, index) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.dropdownMenuItem,
                { borderBottomColor: colors.inputBorder },
                value === option && { backgroundColor: colors.dropdownActiveItem },
                index === STOP_OPTIONS.length - 1 && { borderBottomWidth: 0 },
              ]}
              onPress={() => { onValueChange(option); setOpen(false); }}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.dropdownMenuItemText,
                  { color: colors.chevron },
                  value === option && { color: '#4F8EF7', fontWeight: '700' },
                ]}
              >
                {option}
              </Text>
              {value === option && (
                <Text style={{ fontSize: 14, color: '#4F8EF7', fontWeight: '700' }}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

// ─── Section Card ─────────────────────────────────────────────────────────────
const SectionCard = ({ iconBg, iconContent, title, children }) => {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <TouchableOpacity
        style={styles.cardHeader}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View style={[styles.cardIcon, { backgroundColor: iconBg }]}>
          <Text style={{ fontSize: 18 }}>{iconContent}</Text>
        </View>
        <Text style={[styles.cardTitle, { color: colors.title }]}>{title}</Text>
        <View style={[styles.cardChevron, { backgroundColor: colors.cardChevronBg }]}>
          <Text style={[styles.chevronText, { color: colors.chevron }]}>
            {expanded ? '∧' : '∨'}
          </Text>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.cardBody}>
          {children}
        </View>
      )}
    </View>
  );
};

// ─── Theme Selector ───────────────────────────────────────────────────────────
const ThemeSelector = ({ selected, onSelect }) => {
  const { colors } = useTheme();
  const themes = [
    { key: 'light',  label: 'LIGHT',  icon: '☀️' },
    { key: 'dark',   label: 'DARK',   icon: '🌙' },
    { key: 'system', label: 'SYSTEM', icon: '🖥️' },
  ];
  return (
    <View style={styles.themeSelector}>
      {themes.map((t) => (
        <TouchableOpacity
          key={t.key}
          style={[
            styles.themeOption,
            { backgroundColor: colors.inputBg },
            selected === t.key && styles.themeOptionActive,
          ]}
          onPress={() => onSelect(t.key)}
          activeOpacity={0.8}
        >
          <Text style={styles.themeIcon}>{t.icon}</Text>
          <Text
            style={[
              styles.themeLabel,
              { color: colors.chevron },
              selected === t.key && { color: '#FFFFFF' },
            ]}
          >
            {t.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

// ─── Bottom Tab Bar ───────────────────────────────────────────────────────────
const TabBar = ({ active = 'settings' }) => {
  const { colors } = useTheme();
  const tabs = [
    { key: 'home',     label: 'HOME',   icon: '⌂' },
    { key: 'routes',   label: 'ROUTES', icon: '🗺' },
    { key: 'plan',     label: 'PLAN',   icon: '📅' },
    { key: 'settings', label: 'SET',    icon: '⚙️' },
  ];
  return (
    <View style={[styles.tabBar, { backgroundColor: colors.tabBar }]}>
      {tabs.map((tab) => (
        <TouchableOpacity key={tab.key} style={styles.tabItem} activeOpacity={0.7}>
          {tab.key === active ? (
            <View style={styles.tabActiveCircle}>
              <Text style={[styles.tabIcon, { color: '#fff' }]}>{tab.icon}</Text>
              <Text style={[styles.tabLabel, { color: '#fff' }]}>{tab.label}</Text>
            </View>
          ) : (
            <>
              <Text style={[styles.tabIcon, { color: colors.tabIcon }]}>{tab.icon}</Text>
              <Text style={[styles.tabLabel, { color: colors.tabIcon }]}>{tab.label}</Text>
            </>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function SettingsScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [alertThreshold, setAlertThreshold]             = useState('2 stops away');
  const [pushAlerts, setPushAlerts]                     = useState(true);
  const [inAppAlerts, setInAppAlerts]                   = useState(true);
  const [sound, setSound]                               = useState(true);
  const [vibration, setVibration]                       = useState(true);
  const [theme, setTheme]                               = useState('system');
  const [reducedMotion, setReducedMotion]               = useState(false);

  const isDark = theme === 'dark';
  const colors = isDark ? DARK : LIGHT;

  return (
    <ThemeContext.Provider value={{ colors, isDark }}>
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
        <StatusBar barStyle={colors.statusBar} backgroundColor={colors.bg} />

        {/* ── Header ── */}
        <View style={[styles.header, { backgroundColor: colors.bg }]}>
          <View style={styles.headerLeft}>
            <View style={styles.headerBusIcon}>
              <Text style={{ fontSize: 22 }}>🚌</Text>
            </View>
            <View>
              <Text style={[styles.headerTitle, { color: colors.title }]}>UNITRANS</Text>
              <View style={styles.liveRow}>
                <View style={styles.liveDot} />
                <Text style={[styles.liveText, { color: colors.subtitle }]}>LIVE SYSTEM</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity style={styles.bellButton}>
            <Text style={{ fontSize: 22 }}>🔔</Text>
          </TouchableOpacity>
        </View>

        {/* ── Page Title ── */}
        <View style={styles.pageTitleRow}>
          <Text style={styles.pageTitleIcon}>⚙️</Text>
          <Text style={[styles.pageTitle, { color: colors.title }]}>SETTINGS</Text>
        </View>

        {/* ── Scrollable Content ── */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* GENERAL */}
          <SectionCard iconBg="#4F8EF7" iconContent="🟦" title="GENERAL">
            <ToggleRow
              label="ENABLE NOTIFICATIONS"
              subtitle="Bus approach alerts & updates"
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
            />
            <View style={[styles.divider, { backgroundColor: colors.divider }]} />
            <DropdownRow
              label="ALERT THRESHOLD"
              value={alertThreshold}
              onValueChange={setAlertThreshold}
            />
          </SectionCard>

          {/* PREFERENCES */}
          <SectionCard iconBg="#9B59B6" iconContent="🟪" title="PREFERENCES">
            <ToggleRow icon="📱" iconColor="#4F8EF7" label="PUSH ALERTS"   value={pushAlerts}  onValueChange={setPushAlerts} />
            <View style={[styles.divider, { backgroundColor: colors.divider }]} />
            <ToggleRow icon="🪟" iconColor="#E74C8B" label="IN-APP ALERTS" value={inAppAlerts} onValueChange={setInAppAlerts} />
            <View style={[styles.divider, { backgroundColor: colors.divider }]} />
            <ToggleRow icon="🔊" iconColor="#2ECC71" label="SOUND"         value={sound}       onValueChange={setSound} />
            <View style={[styles.divider, { backgroundColor: colors.divider }]} />
            <ToggleRow icon="📳" iconColor="#E67E22" label="VIBRATION"     value={vibration}   onValueChange={setVibration} />
          </SectionCard>

          {/* APPEARANCE */}
          <SectionCard iconBg="#E91E8C" iconContent="🎨" title="APPEARANCE">
            <View style={styles.sectionLabel}>
              <Text style={[styles.sectionLabelText, { color: colors.label }]}>SELECTED THEME</Text>
            </View>
            <ThemeSelector selected={theme} onSelect={setTheme} />
            <View style={[styles.divider, { backgroundColor: colors.divider }]} />
            <ToggleRow
              label="REDUCED MOTION"
              subtitle="Simplify animations"
              value={reducedMotion}
              onValueChange={setReducedMotion}
            />
          </SectionCard>

          <View style={{ height: 20 }} />
        </ScrollView>

        {/* ── Bottom Tab Bar ── */}
        <TabBar active="settings" />
      </SafeAreaView>
    </ThemeContext.Provider>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerBusIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: '#4F8EF7',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: '800', letterSpacing: 1.5 },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 1 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#2ECC71' },
  liveText: { fontSize: 10, fontWeight: '600', letterSpacing: 0.8 },
  bellButton: { padding: 4 },

  pageTitleRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 10, gap: 10,
  },
  pageTitleIcon: { fontSize: 22 },
  pageTitle: { fontSize: 26, fontWeight: '900', letterSpacing: 2 },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 4, gap: 14 },

  card: {
    borderRadius: 20, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', padding: 18, gap: 14 },
  cardIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '800', letterSpacing: 1.2 },
  cardChevron: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  chevronText: { fontSize: 14, fontWeight: '700' },
  cardBody: { paddingHorizontal: 18, paddingBottom: 18 },

  toggleRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingVertical: 12,
  },
  toggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  toggleIcon: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  toggleLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8 },
  toggleSubtitle: { fontSize: 11, marginTop: 1 },

  divider: { height: 1, marginVertical: 2 },

  dropdownRow: { paddingVertical: 12, gap: 8 },
  dropdownLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  dropdownBox: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
  },
  dropdownValue: { fontSize: 14, fontWeight: '600' },
  dropdownChevron: { fontSize: 18 },
  dropdownMenu: { borderBottomLeftRadius: 12, borderBottomRightRadius: 12, overflow: 'hidden' },
  dropdownMenuItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1,
  },
  dropdownMenuItemText: { fontSize: 13, fontWeight: '500' },

  sectionLabel: { paddingTop: 4, paddingBottom: 10 },
  sectionLabelText: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },

  themeSelector: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  themeOption: {
    flex: 1, alignItems: 'center', paddingVertical: 12,
    borderRadius: 14, gap: 4,
  },
  themeOptionActive: { backgroundColor: '#4F8EF7' },
  themeIcon: { fontSize: 20 },
  themeLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },

  tabBar: {
    flexDirection: 'row',
    paddingVertical: 10, paddingHorizontal: 8,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08, shadowRadius: 10, elevation: 10,
    alignItems: 'center',
  },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 4, gap: 3 },
  tabActiveCircle: {
    backgroundColor: '#4F8EF7', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center', gap: 2,
  },
  tabIcon: { fontSize: 20 },
  tabLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 0.8 },
});