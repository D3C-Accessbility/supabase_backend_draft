import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  StatusBar, ScrollView, ActivityIndicator,
} from 'react-native';
import * as Location from 'expo-location';
import { getPredictionsNear } from '../lib/unitransApi';

// ─── Tab Bar ──────────────────────────────────────────────────────────────────
const TabBar = ({ active = 'arrivals', navigation }) => {
  const tabs = [
    { key: 'home',     label: 'HOME',   icon: '⌂',  screen: 'Home' },
    { key: 'routes',   label: 'ROUTES', icon: '🗺',  screen: 'Routes' },
    { key: 'plan',     label: 'PLAN',   icon: '📅',  screen: 'Schedules' },
    { key: 'settings', label: 'SET',    icon: '⚙️',  screen: 'Settings' },
  ];
  return (
    <View style={styles.tabBar}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={styles.tabItem}
          activeOpacity={0.7}
          onPress={() => tab.key !== active && navigation?.navigate(tab.screen)}
        >
          {tab.key === active ? (
            <View style={styles.tabActiveCircle}>
              <Text style={[styles.tabIcon, { color: '#fff' }]}>{tab.icon}</Text>
              <Text style={[styles.tabLabel, { color: '#fff' }]}>{tab.label}</Text>
            </View>
          ) : (
            <>
              <Text style={styles.tabIcon}>{tab.icon}</Text>
              <Text style={styles.tabLabel}>{tab.label}</Text>
            </>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
};

// ─── Bus Card ─────────────────────────────────────────────────────────────────
const BusCard = ({ bundle }) => {
  const routeId    = bundle.route?.id ?? '?';
  const routeTitle = bundle.route?.title ?? routeId;
  const stopName   = bundle.stop?.name ?? 'Unknown stop';
  const routeColor = bundle.route?.color ? `#${bundle.route.color}` : '#3B5BDB';
  const preds      = bundle.predictions || [];
  const mins       = preds.map(p => p.minutes).filter(m => typeof m === 'number' && isFinite(m));
  const nextMin    = mins.length ? Math.min(...mins) : null;
  const isArriving = nextMin !== null && nextMin <= 1;
  const dir        = preds[0]?.direction;
  const dest       = dir?.destinationName ?? dir?.name ?? '';
  const occupancy  = preds[0]?.occupancyDescription ?? preds[0]?.occupancyStatus ?? null;
  const delayed    = preds.some(p => p.delay && p.delay > 0);

  return (
    <View style={styles.busCard}>
      <View style={[styles.busCardIcon, { backgroundColor: routeColor + '22', borderColor: routeColor }]}>
        <Text style={[styles.busCardIconText, { color: routeColor }]}>{routeId}</Text>
      </View>
      <View style={styles.busCardBody}>
        <View style={styles.busCardTitleRow}>
          <Text style={styles.busCardTitle}>{routeTitle}</Text>
          {delayed && (
            <View style={styles.delayBadge}>
              <Text style={styles.delayBadgeText}>DELAYED</Text>
            </View>
          )}
        </View>
        {dest !== '' && <Text style={styles.busCardDest}>→ {dest}</Text>}
        <Text style={styles.busCardStop}>At {stopName}</Text>
        <View style={styles.busCardMeta}>
          <View style={[styles.etaBadge, isArriving && styles.etaBadgeNow]}>
            <Text style={[styles.etaText, isArriving && { color: '#fff' }]}>
              {nextMin === null ? 'N/A' : isArriving ? 'ARRIVING' : `${nextMin} MIN`}
            </Text>
          </View>
          {mins.slice(1, 3).map((m, i) => (
            <Text key={i} style={styles.nextMins}>{m} min</Text>
          ))}
          {occupancy && <Text style={styles.occupancy}>👤 {occupancy}</Text>}
        </View>
      </View>
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ArrivalsScreen({ navigation }) {
  const [coords, setCoords]     = useState(null);
  const [bundles, setBundles]   = useState([]);
  const [status, setStatus]     = useState('idle'); // idle | locating | loading | ready | error
  const [error, setError]       = useState('');
  const [updatedAt, setUpdatedAt] = useState(null);

  const fetchPredictions = useCallback(async (location) => {
    setStatus('loading');
    setError('');
    try {
      const data = await getPredictionsNear(location.lat, location.lon);
      const arr = Array.isArray(data) ? data : [];
      // Sort by soonest arrival
      arr.sort((a, b) => {
        const aMin = Math.min(...(a.predictions || []).map(p => p.minutes).filter(Number.isFinite), Infinity);
        const bMin = Math.min(...(b.predictions || []).map(p => p.minutes).filter(Number.isFinite), Infinity);
        return aMin - bMin;
      });
      setBundles(arr);
      setUpdatedAt(new Date());
      setStatus('ready');
    } catch (e) {
      setError(e.message || 'Failed to load predictions.');
      setStatus('error');
    }
  }, []);

  const requestLocation = useCallback(async () => {
    setStatus('locating');
    setError('');
    try {
      const { status: permStatus } = await Location.requestForegroundPermissionsAsync();
      if (permStatus !== 'granted') {
        setError('Location permission denied. Please enable it in Settings.');
        setStatus('error');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const next = { lat: loc.coords.latitude, lon: loc.coords.longitude };
      setCoords(next);
      await fetchPredictions(next);
    } catch (e) {
      setError('Could not get your location.');
      setStatus('error');
    }
  }, [fetchPredictions]);

  useEffect(() => {
    requestLocation();
  }, []);

  const timeStr = updatedAt
    ? updatedAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : '--';

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#3B5BDB" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerBusIcon}><Text style={{ fontSize: 22 }}>🚌</Text></View>
          <View>
            <Text style={styles.headerTitle}>UNITRANS</Text>
            <View style={styles.liveRow}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE SYSTEM</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={() => coords ? fetchPredictions(coords) : requestLocation()}
          disabled={status === 'locating' || status === 'loading'}
        >
          <Text style={styles.refreshIcon}>↻</Text>
        </TouchableOpacity>
      </View>

      {/* Page title + updated time */}
      <View style={styles.pageTitleRow}>
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Text style={styles.pageTitleIcon}>📍</Text>
            <Text style={styles.pageTitle}>NEARBY</Text>
          </View>
          <Text style={styles.updatedAt}>Updated {timeStr}</Text>
        </View>
        {bundles.length > 0 && (
          <View style={styles.activeBadge}>
            <Text style={styles.activeBadgeText}>{bundles.length} ACTIVE</Text>
          </View>
        )}
      </View>

      {/* States */}
      {(status === 'locating' || status === 'loading') && (
        <View style={styles.loadingBox}>
          <ActivityIndicator color="#3B5BDB" size="large" />
          <Text style={styles.loadingText}>
            {status === 'locating' ? 'Getting your location...' : 'Loading buses near you...'}
          </Text>
        </View>
      )}

      {status === 'error' && (
        <View style={styles.errorBox}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorMsg}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={requestLocation}>
            <Text style={styles.retryBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {status === 'ready' && bundles.length === 0 && (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyIcon}>🚌</Text>
          <Text style={styles.emptyTitle}>No buses nearby</Text>
          <Text style={styles.emptySubtitle}>Try again in a few minutes</Text>
        </View>
      )}

      {status === 'ready' && bundles.length > 0 && (
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionLabel}>BUSES RUNNING NOW</Text>
          {bundles.map(bundle => (
            <BusCard key={`${bundle.route?.id}-${bundle.stop?.id}`} bundle={bundle} />
          ))}
          <View style={{ height: 20 }} />
        </ScrollView>
      )}

      <TabBar active="arrivals" navigation={navigation} />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F6FA' },

  header: {
    backgroundColor: '#3B5BDB',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerBusIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: '800', letterSpacing: 1.5, color: '#fff' },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 1 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#2ECC71' },
  liveText: { fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: '600', letterSpacing: 0.8 },
  refreshBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  refreshIcon: { fontSize: 22, color: '#fff', fontWeight: '700' },

  pageTitleRow: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
  },
  pageTitleIcon: { fontSize: 22 },
  pageTitle: { fontSize: 26, fontWeight: '900', letterSpacing: 2, color: '#1A1A2E' },
  updatedAt: { fontSize: 12, color: '#AAA', marginTop: 4, fontWeight: '500' },
  activeBadge: {
    backgroundColor: '#EEF2FF', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 5, marginTop: 8,
  },
  activeBadgeText: { fontSize: 11, fontWeight: '800', color: '#3B5BDB', letterSpacing: 0.8 },

  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  loadingText: { fontSize: 15, color: '#888', fontWeight: '500' },

  errorBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 12 },
  errorIcon: { fontSize: 40 },
  errorMsg: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 22 },
  retryBtn: {
    backgroundColor: '#3B5BDB', borderRadius: 50,
    paddingHorizontal: 28, paddingVertical: 12, marginTop: 4,
  },
  retryBtnText: { fontSize: 14, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },

  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: '#1A1A2E' },
  emptySubtitle: { fontSize: 13, color: '#AAA' },

  scroll: { flex: 1, paddingHorizontal: 16 },
  sectionLabel: {
    fontSize: 11, fontWeight: '800', color: '#AAA',
    letterSpacing: 1.5, marginBottom: 12,
  },

  busCard: {
    backgroundColor: '#fff', borderRadius: 16,
    padding: 16, flexDirection: 'row', alignItems: 'flex-start',
    marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  busCardIcon: {
    width: 52, height: 52, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, marginRight: 14,
  },
  busCardIconText: { fontSize: 15, fontWeight: '900' },
  busCardBody: { flex: 1 },
  busCardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  busCardTitle: { fontSize: 14, fontWeight: '800', color: '#1A1A2E', flex: 1 },
  busCardDest: { fontSize: 12, color: '#888', marginBottom: 2 },
  busCardStop: { fontSize: 12, color: '#AAA', marginBottom: 8 },
  busCardMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  etaBadge: {
    backgroundColor: '#F5F6FA', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  etaBadgeNow: { backgroundColor: '#3B5BDB' },
  etaText: { fontSize: 11, fontWeight: '800', color: '#1A1A2E', letterSpacing: 0.5 },
  nextMins: { fontSize: 12, color: '#888', fontWeight: '600' },
  occupancy: { fontSize: 12, color: '#888' },
  delayBadge: {
    backgroundColor: '#FFF0F0', borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 3,
  },
  delayBadgeText: { fontSize: 10, fontWeight: '800', color: '#E53935', letterSpacing: 0.5 },

  tabBar: {
    flexDirection: 'row', backgroundColor: '#fff',
    paddingVertical: 10, paddingHorizontal: 8,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08, shadowRadius: 10, elevation: 10, alignItems: 'center',
  },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 4, gap: 3 },
  tabActiveCircle: {
    backgroundColor: '#3B5BDB', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center', gap: 2,
  },
  tabIcon: { fontSize: 20, color: '#999' },
  tabLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 0.8, color: '#999' },
});