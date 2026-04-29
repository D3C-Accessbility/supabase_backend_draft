import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  StatusBar, ScrollView, ActivityIndicator, TextInput,
} from 'react-native';
import { getRoutes, getStopsByRoute, getPredictionsByStop } from '../lib/unitransApi';

// ─── Tab Bar ──────────────────────────────────────────────────────────────────
const TabBar = ({ active = 'routes', navigation }) => {
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

// ─── Route Color Pill ─────────────────────────────────────────────────────────
const RouteIcon = ({ route }) => {
  const bg = route.color ? `#${route.color}` : '#3B5BDB';
  const fg = route.textColor ? `#${route.textColor}` : '#FFFFFF';
  return (
    <View style={[styles.routeIconBox, { backgroundColor: bg }]}>
      <Text style={[styles.routeIconText, { color: fg }]}>{route.id}</Text>
    </View>
  );
};

// ─── Stop Row ─────────────────────────────────────────────────────────────────
const StopRow = ({ stop, routeId, onPress }) => (
  <TouchableOpacity style={styles.stopRow} onPress={onPress} activeOpacity={0.7}>
    <View style={styles.stopDot} />
    <View style={styles.stopRowContent}>
      <Text style={styles.stopName}>{stop.name ?? stop.id}</Text>
      {stop.code != null && <Text style={styles.stopCode}>Stop #{stop.code}</Text>}
    </View>
    <Text style={styles.chevronRight}>›</Text>
  </TouchableOpacity>
);

// ─── Arrivals Sheet ───────────────────────────────────────────────────────────
const ArrivalsSheet = ({ stop, routeId, onClose }) => {
  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    getPredictionsByStop(stop.id, routeId)
      .then(data => setBundles(Array.isArray(data) ? data : []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [stop.id, routeId]);

  const allMins = bundles.flatMap(b =>
    (b.predictions || [])
      .map(p => p.minutes)
      .filter(m => typeof m === 'number' && isFinite(m))
  ).sort((a, b) => a - b);

  return (
    <View style={styles.arrivalsSheet}>
      <View style={styles.sheetHandle} />
      <View style={styles.arrivalsHeader}>
        <View>
          <Text style={styles.arrivalsTitle}>{stop.name ?? stop.id}</Text>
          <Text style={styles.arrivalsSubtitle}>Real-time arrivals</Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
      </View>

      {loading && <ActivityIndicator color="#3B5BDB" style={{ margin: 24 }} />}
      {error !== '' && <Text style={styles.errorText}>{error}</Text>}

      {!loading && allMins.length === 0 && !error && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🚌</Text>
          <Text style={styles.emptyText}>No arrivals right now</Text>
        </View>
      )}

      {!loading && allMins.length > 0 && (
        <View style={styles.arrivalsGrid}>
          {allMins.slice(0, 6).map((m, i) => (
            <View key={i} style={[styles.arrivalPill, m <= 1 && styles.arrivalPillNow]}>
              <Text style={[styles.arrivalMins, m <= 1 && { color: '#fff' }]}>
                {m <= 1 ? 'NOW' : `${m}`}
              </Text>
              {m > 1 && <Text style={styles.arrivalMinLabel}>min</Text>}
            </View>
          ))}
        </View>
      )}

      {!loading && bundles.map((b, i) => {
        const dir = b.predictions?.[0]?.direction;
        const dest = dir?.destinationName ?? dir?.name ?? '';
        const mins = (b.predictions || []).map(p => p.minutes).filter(m => typeof m === 'number' && isFinite(m));
        if (!mins.length) return null;
        return (
          <View key={i} style={styles.bundleRow}>
            <View style={styles.bundleLeft}>
              <Text style={styles.bundleRoute}>Route {b.route?.id ?? '?'}</Text>
              {dest !== '' && <Text style={styles.bundleDest}>→ {dest}</Text>}
            </View>
            <Text style={styles.bundleMins}>{mins.slice(0, 3).join(', ')} min</Text>
          </View>
        );
      })}
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function RoutesScreen({ navigation }) {
  const [routes, setRoutes] = useState([]);
  const [stops, setStops] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [selectedStop, setSelectedStop] = useState(null);
  const [loadingRoutes, setLoadingRoutes] = useState(true);
  const [loadingStops, setLoadingStops] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    getRoutes()
      .then(data => setRoutes(Array.isArray(data) ? data : []))
      .catch(e => setError(e.message))
      .finally(() => setLoadingRoutes(false));
  }, []);

  const selectRoute = (route) => {
    setSelectedRoute(route);
    setSelectedStop(null);
    setStops([]);
    setLoadingStops(true);
    getStopsByRoute(route.id)
      .then(data => setStops(Array.isArray(data) ? data : []))
      .catch(e => setError(e.message))
      .finally(() => setLoadingStops(false));
  };

  const filteredRoutes = search.trim()
    ? routes.filter(r => (r.title ?? r.id ?? '').toLowerCase().includes(search.toLowerCase()))
    : routes;

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
      </View>

      {/* Page title */}
      <View style={styles.pageTitleRow}>
        <Text style={styles.pageTitleIcon}>🗺</Text>
        <Text style={styles.pageTitle}>ROUTES</Text>
      </View>

      {/* Search bar */}
      <View style={styles.searchBarBox}>
        <Text style={{ fontSize: 16, color: '#AAA', marginRight: 8 }}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search routes..."
          placeholderTextColor="#AAA"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {error !== '' && <Text style={styles.errorText}>{error}</Text>}

      {/* Body: routes list or stops list */}
      {selectedRoute == null ? (
        // ── Routes list ──
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {loadingRoutes && <ActivityIndicator color="#3B5BDB" style={{ margin: 24 }} />}
          {!loadingRoutes && filteredRoutes.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No routes found</Text>
            </View>
          )}
          {filteredRoutes.map(route => (
            <TouchableOpacity
              key={route.id}
              style={styles.routeCard}
              onPress={() => selectRoute(route)}
              activeOpacity={0.8}
            >
              <RouteIcon route={route} />
              <View style={styles.routeCardBody}>
                <Text style={styles.routeCardTitle}>{route.title ?? route.id}</Text>
                <Text style={styles.routeCardSub}>Tap to see stops</Text>
              </View>
              <Text style={styles.chevronRight}>›</Text>
            </TouchableOpacity>
          ))}
          <View style={{ height: 20 }} />
        </ScrollView>
      ) : (
        // ── Stops list ──
        <View style={{ flex: 1 }}>
          {/* Back + route header */}
          <View style={styles.routeDetailHeader}>
            <TouchableOpacity onPress={() => { setSelectedRoute(null); setSelectedStop(null); }} style={styles.backBtn}>
              <Text style={styles.backBtnText}>‹ All Routes</Text>
            </TouchableOpacity>
            <View style={styles.routeDetailTitle}>
              <RouteIcon route={selectedRoute} />
              <Text style={styles.routeDetailName}>{selectedRoute.title ?? selectedRoute.id}</Text>
            </View>
          </View>

          {loadingStops && <ActivityIndicator color="#3B5BDB" style={{ margin: 24 }} />}

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            {stops.length === 0 && !loadingStops && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No stops for this route</Text>
              </View>
            )}
            <View style={styles.stopsCard}>
              {stops.map((stop, i) => (
                <View key={stop.id}>
                  <StopRow
                    stop={stop}
                    routeId={selectedRoute.id}
                    onPress={() => setSelectedStop(stop)}
                  />
                  {i < stops.length - 1 && <View style={styles.stopDivider} />}
                </View>
              ))}
            </View>
            <View style={{ height: 20 }} />
          </ScrollView>

          {/* Arrivals bottom sheet */}
          {selectedStop && (
            <View style={styles.sheetOverlay}>
              <TouchableOpacity style={styles.sheetBackdrop} onPress={() => setSelectedStop(null)} />
              <ArrivalsSheet
                stop={selectedStop}
                routeId={selectedRoute.id}
                onClose={() => setSelectedStop(null)}
              />
            </View>
          )}
        </View>
      )}

      <TabBar active="routes" navigation={navigation} />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F6FA' },

  header: {
    backgroundColor: '#3B5BDB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
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

  pageTitleRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14, gap: 10,
  },
  pageTitleIcon: { fontSize: 22 },
  pageTitle: { fontSize: 26, fontWeight: '900', letterSpacing: 2, color: '#1A1A2E' },

  searchBarBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  searchInput: { flex: 1, fontSize: 15, color: '#1A1A2E' },

  scroll: { flex: 1, paddingHorizontal: 16 },

  routeCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  routeIconBox: {
    width: 48, height: 48, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 14,
  },
  routeIconText: { fontSize: 16, fontWeight: '900' },
  routeCardBody: { flex: 1 },
  routeCardTitle: { fontSize: 15, fontWeight: '800', color: '#1A1A2E' },
  routeCardSub: { fontSize: 12, color: '#AAA', marginTop: 2 },
  chevronRight: { fontSize: 22, color: '#CCC', fontWeight: '600' },

  // Route detail
  routeDetailHeader: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F8',
  },
  backBtn: { marginBottom: 10 },
  backBtnText: { fontSize: 14, color: '#3B5BDB', fontWeight: '700' },
  routeDetailTitle: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  routeDetailName: { fontSize: 18, fontWeight: '900', color: '#1A1A2E' },

  stopsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 4,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  stopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  stopDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: '#3B5BDB',
    borderWidth: 2, borderColor: '#EEF2FF',
  },
  stopRowContent: { flex: 1 },
  stopName: { fontSize: 14, fontWeight: '700', color: '#1A1A2E' },
  stopCode: { fontSize: 12, color: '#AAA', marginTop: 2 },
  stopDivider: { height: 1, backgroundColor: '#F0F2F8', marginLeft: 38 },

  // Arrivals sheet
  sheetOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end' },
  sheetBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  arrivalsSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 12,
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: '#DDD', alignSelf: 'center', marginTop: 10, marginBottom: 12,
  },
  arrivalsHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', paddingHorizontal: 20, marginBottom: 16,
  },
  arrivalsTitle: { fontSize: 18, fontWeight: '900', color: '#1A1A2E' },
  arrivalsSubtitle: { fontSize: 13, color: '#AAA', marginTop: 2 },
  closeBtn: { padding: 4 },
  closeBtnText: { fontSize: 18, color: '#999' },
  arrivalsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, gap: 10, marginBottom: 16,
  },
  arrivalPill: {
    backgroundColor: '#F5F6FA', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 12, alignItems: 'center',
  },
  arrivalPillNow: { backgroundColor: '#3B5BDB' },
  arrivalMins: { fontSize: 20, fontWeight: '900', color: '#1A1A2E' },
  arrivalMinLabel: { fontSize: 10, color: '#AAA', fontWeight: '600', letterSpacing: 0.5 },
  bundleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: '#F0F2F8',
  },
  bundleLeft: { flex: 1 },
  bundleRoute: { fontSize: 13, fontWeight: '700', color: '#1A1A2E' },
  bundleDest: { fontSize: 12, color: '#888', marginTop: 2 },
  bundleMins: { fontSize: 13, fontWeight: '700', color: '#3B5BDB' },

  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyText: { fontSize: 15, color: '#AAA', fontWeight: '600' },
  errorText: { color: '#E53935', fontSize: 13, paddingHorizontal: 20, marginBottom: 8 },

  // Tab bar
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