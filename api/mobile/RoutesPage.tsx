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
  Image,
  FlatList,
} from 'react-native';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface BusStop {
  id: string;
  name: string;
}

export interface BusLine {
  id: string;
  name: string;
  color: string;
  pattern?: 'dots' | 'stripes' | 'grid' | 'waves' | 'none';
  stops: BusStop[];
}

interface RoutesPageProps {
  busLines: BusLine[];
}

type FilterType = 'all' | 'ontime' | 'delayed' | 'favorites';

// ─── Sub-components ──────────────────────────────────────────────────────────

/** Mimics shadcn Badge */
function Badge({
  children,
  color,
  bgColor,
  borderColor,
}: {
  children: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
}) {
  return (
    <View style={[styles.badge, { backgroundColor: bgColor, borderColor }]}>
      <Text style={[styles.badgeText, { color }]}>{children}</Text>
    </View>
  );
}

/** Animated chevron that rotates when expanded */
function ChevronIcon({ expanded }: { expanded: boolean }) {
  const rotation = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.spring(rotation, {
      toValue: expanded ? 1 : 0,
      useNativeDriver: true,
      stiffness: 200,
      damping: 20,
    }).start();
  }, [expanded]);

  const rotate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <Animated.View style={[styles.iconCircle, { transform: [{ rotate }] }]}>
      {/* Simple chevron drawn with borders */}
      <View style={styles.chevron} />
    </Animated.View>
  );
}

/** Star icon (filled or outline) */
function StarIcon({ filled, color }: { filled: boolean; color: string }) {
  // Unicode star as a simple stand-in — swap for react-native-vector-icons if available
  return (
    <Text style={{ fontSize: 16, color, lineHeight: 18 }}>{filled ? '★' : '☆'}</Text>
  );
}

/** Single bus route card */
function RouteCard({
  line,
  status,
  isFavorite,
  onToggleFavorite,
}: {
  line: BusLine;
  status: 'ontime' | 'delayed';
  isFavorite: boolean;
  onToggleFavorite: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(prev => !prev);
  };

  return (
    <View
      style={[
        styles.card,
        expanded && { borderColor: line.color, borderWidth: 2, shadowOpacity: 0.18 },
      ]}
    >
      {/* ── Card Header Row ── */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={toggle}
        style={styles.cardHeader}
      >
        {/* Line badge */}
        <View style={[styles.lineBadge, { backgroundColor: line.color }]}>
          <Text style={styles.lineBadgeNumber}>{line.name.split(' ')[0]}</Text>
          <Text style={styles.lineBadgeLabel}>Line</Text>
        </View>

        {/* Title + meta */}
        <View style={styles.cardInfo}>
          <Text style={styles.lineName} numberOfLines={1}>
            {line.name}
          </Text>
          <View style={styles.metaRow}>
            <Badge color="#6b7280" bgColor="transparent" borderColor="#d1d5db">
              {line.stops.length} STOPS
            </Badge>
            <Text
              style={[
                styles.statusText,
                { color: status === 'ontime' ? '#16a34a' : '#ea580c' },
              ]}
            >
              ⏱ {status === 'ontime' ? 'ON TIME' : 'DELAYED'}
            </Text>
          </View>
        </View>

        {/* Favorite + chevron */}
        <View style={styles.cardActions}>
          <TouchableOpacity
            onPress={onToggleFavorite}
            style={[
              styles.iconCircle,
              isFavorite && { backgroundColor: '#fef9c3' },
            ]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <StarIcon filled={isFavorite} color={isFavorite ? '#ca8a04' : '#9ca3af'} />
          </TouchableOpacity>
          <ChevronIcon expanded={expanded} />
        </View>
      </TouchableOpacity>

      {/* ── Expanded Content ── */}
      {expanded && (
        <View style={styles.expandedContent}>
          <View style={styles.divider} />

          {/* Map preview */}
          <View style={styles.mapPreview}>
            <Image
              source={{
                uri: 'https://images.unsplash.com/photo-1624964682028-1b0337583626?q=80&w=1000&auto=format&fit=crop',
              }}
              style={styles.mapImage}
              resizeMode="cover"
            />
            <View style={styles.mapOverlay}>
              <TouchableOpacity style={styles.mapButton} activeOpacity={0.8}>
                <Text style={styles.mapButtonText}>🗺  VIEW MAP</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Stops list */}
          <View style={styles.stopsContainer}>
            <Text style={styles.sectionLabel}>📍 Major Stops</Text>
            <View style={styles.stopsList}>
              {/* Vertical track line */}
              <View style={styles.verticalLine} />

              {line.stops.slice(0, 5).map((stop, idx) => (
                <View key={stop.id} style={styles.stopRow}>
                  <View
                    style={[
                      styles.stopDot,
                      idx === 0 && styles.stopDotFirst,
                    ]}
                  />
                  <Text style={styles.stopName}>{stop.name}</Text>
                </View>
              ))}

              {line.stops.length > 5 && (
                <Text style={styles.moreStops}>
                  + {line.stops.length - 5} more stops
                </Text>
              )}
            </View>
          </View>

          {/* CTA button */}
          <TouchableOpacity
            style={[styles.ctaButton, { backgroundColor: line.color }]}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaButtonText}>VIEW FULL SCHEDULE</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function RoutesPage({ busLines }: RoutesPageProps) {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Stable mock statuses (won't re-randomize on re-render)
  const lineStatuses = useRef<Record<string, 'ontime' | 'delayed'>>(
    busLines.reduce((acc, line) => {
      acc[line.id] = Math.random() > 0.3 ? 'ontime' : 'delayed';
      return acc;
    }, {} as Record<string, 'ontime' | 'delayed'>)
  ).current;

  const toggleFavorite = (lineId: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      next.has(lineId) ? next.delete(lineId) : next.add(lineId);
      return next;
    });
  };

  const filteredLines = busLines
    .filter(line => {
      if (activeFilter === 'favorites') return favorites.has(line.id);
      if (activeFilter === 'ontime') return lineStatuses[line.id] === 'ontime';
      if (activeFilter === 'delayed') return lineStatuses[line.id] === 'delayed';
      return true;
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const ontimeCount = Object.values(lineStatuses).filter(s => s === 'ontime').length;
  const delayedCount = Object.values(lineStatuses).filter(s => s === 'delayed').length;
  const liveCount = Math.floor(busLines.length * 0.8);

  const filters: { id: FilterType; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: busLines.length },
    { id: 'ontime', label: 'On Time', count: ontimeCount },
    { id: 'delayed', label: 'Delayed', count: delayedCount },
    { id: 'favorites', label: 'Favorites', count: favorites.size },
  ];

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
            <Text style={{ fontSize: 22 }}>🚌</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>Bus Routes</Text>
            <Text style={styles.headerSubtitle}>Live System Status</Text>
          </View>
        </View>
        <Badge color="#15803d" bgColor="#f0fdf4" borderColor="#bbf7d0">
          {liveCount} LIVE
        </Badge>
      </View>

      {/* ── System Status Summary ── */}
      <View style={styles.summaryGrid}>
        <View style={[styles.summaryCard, { backgroundColor: '#f0fdf4' }]}>
          <Text style={styles.summaryLabel}>✅ On Time</Text>
          <Text style={[styles.summaryValue, { color: '#16a34a' }]}>{ontimeCount}</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: '#fff7ed' }]}>
          <Text style={styles.summaryLabel}>⚠️ Delayed</Text>
          <Text style={[styles.summaryValue, { color: '#ea580c' }]}>{delayedCount}</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: '#eff6ff' }]}>
          <Text style={styles.summaryLabel}>🚌 Active</Text>
          <Text style={[styles.summaryValue, { color: '#2563eb' }]}>{liveCount}</Text>
        </View>
      </View>

      {/* ── Filters ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersRow}
      >
        {filters.map(filter => (
          <TouchableOpacity
            key={filter.id}
            onPress={() => setActiveFilter(filter.id)}
            style={[
              styles.filterChip,
              activeFilter === filter.id && styles.filterChipActive,
            ]}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.filterChipText,
                activeFilter === filter.id && styles.filterChipTextActive,
              ]}
            >
              {filter.label} ({filter.count})
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── Routes List ── */}
      {filteredLines.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No routes match this filter</Text>
        </View>
      ) : (
        <View style={styles.routesList}>
          {filteredLines.map(line => (
            <RouteCard
              key={line.id}
              line={line}
              status={lineStatuses[line.id]}
              isFavorite={favorites.has(line.id)}
              onToggleFavorite={() => toggleFavorite(line.id)}
            />
          ))}
        </View>
      )}
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
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  headerTitle: {
    fontSize: 22,
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

  // Summary grid
  summaryGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: '900',
  },

  // Badge
  badge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // Filters
  filtersRow: {
    gap: 8,
    paddingHorizontal: 4,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#f3f4f6',
  },
  filterChipActive: {
    backgroundColor: '#111827',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: '#6b7280',
  },
  filterChipTextActive: {
    color: '#ffffff',
  },

  // Routes list
  routesList: {
    gap: 14,
  },

  // Route card
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#f3f4f6',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },

  // Line badge (colored square)
  lineBadge: {
    width: 60,
    height: 60,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  lineBadgeNumber: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
    lineHeight: 26,
  },
  lineBadgeLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },

  // Card info
  cardInfo: {
    flex: 1,
    minWidth: 0,
  },
  lineName: {
    fontSize: 17,
    fontWeight: '900',
    color: '#111827',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },

  // Card actions (star + chevron)
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f9fafb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevron: {
    width: 10,
    height: 10,
    borderRightWidth: 2.5,
    borderBottomWidth: 2.5,
    borderColor: '#9ca3af',
    transform: [{ rotate: '45deg' }, { translateY: -2 }],
  },

  // Expanded content
  expandedContent: {
    paddingHorizontal: 14,
    paddingBottom: 20,
    gap: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginBottom: 4,
  },

  // Map preview
  mapPreview: {
    height: 150,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  mapImage: {
    width: '100%',
    height: '100%',
    opacity: 0.65,
  },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 14,
  },
  mapButton: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
  },
  mapButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: 1,
  },

  // Stops
  stopsContainer: {
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 12,
  },
  stopsList: {
    paddingLeft: 8,
    position: 'relative',
  },
  verticalLine: {
    position: 'absolute',
    left: 15,
    top: 8,
    bottom: 8,
    width: 2,
    backgroundColor: '#e5e7eb',
  },
  stopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 8,
  },
  stopDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#ffffff',
    borderWidth: 3,
    borderColor: '#d1d5db',
    zIndex: 1,
  },
  stopDotFirst: {
    borderColor: '#111827',
    transform: [{ scale: 1.1 }],
  },
  stopName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    flex: 1,
  },
  moreStops: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9ca3af',
    marginTop: 4,
    paddingLeft: 30,
  },

  // CTA button
  ctaButton: {
    borderRadius: 16,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  ctaButtonText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },

  // Empty state
  emptyState: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
});
