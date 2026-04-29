import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  StatusBar, ScrollView, TextInput, Switch, Modal,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import supabase from '../lib/supabase';
import {
  getSchedules, createSchedule, updateSchedule,
  deleteSchedule, getScheduleTimes,
} from '../lib/unitransApi';

function getToken() {
  return supabase.auth.getSession().then(({ data: { session } }) => session?.access_token ?? null);
}

const DAY_OPTIONS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_SHORT   = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const EMPTY_FORM = {
  title: '',
  origin_stop_id: '',
  route_id: '',
  direction_id: '',
  notify_lead_time_min: '10',
  depart_time_local: '',
  days: [],
};

// ─── Tab Bar ──────────────────────────────────────────────────────────────────
const TabBar = ({ active = 'plan', navigation }) => {
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

// ─── Schedule Card ────────────────────────────────────────────────────────────
const ScheduleCard = ({ schedule, onEdit, onDelete }) => {
  const days = schedule._days ?? [];
  return (
    <View style={styles.scheduleCard}>
      <View style={styles.scheduleCardTop}>
        <View style={styles.scheduleCardLeft}>
          <Text style={styles.scheduleTitle}>{schedule.title}</Text>
          <Text style={styles.scheduleMeta}>
            Stop {schedule.origin_stop_id} · Route {schedule.route_id}
          </Text>
          {schedule._depart && (
            <Text style={styles.scheduleMeta}>🕐 {schedule._depart}</Text>
          )}
          <Text style={styles.scheduleMeta}>
            🔔 {schedule.notify_lead_time_min} min lead time
          </Text>
        </View>
        <View style={styles.scheduleCardActions}>
          <TouchableOpacity style={styles.editBtn} onPress={() => onEdit(schedule)} activeOpacity={0.8}>
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteBtn} onPress={() => onDelete(schedule.id)} activeOpacity={0.8}>
            <Text style={styles.deleteBtnText}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>
      {days.length > 0 && (
        <View style={styles.daysRow}>
          {DAY_OPTIONS.map((d, i) => (
            <View key={d} style={[styles.dayChip, days.includes(d) && styles.dayChipActive]}>
              <Text style={[styles.dayChipText, days.includes(d) && styles.dayChipTextActive]}>
                {DAY_SHORT[i]}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

// ─── Schedule Form Modal ──────────────────────────────────────────────────────
const ScheduleFormModal = ({ visible, initial, onClose, onSave, loading }) => {
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (visible) setForm(initial ?? EMPTY_FORM);
  }, [visible, initial]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const toggleDay = (day) => {
    setForm(f => ({
      ...f,
      days: f.days.includes(day) ? f.days.filter(d => d !== day) : [...f.days, day],
    }));
  };

  return (
    <Modal transparent visible={visible} animationType="slide">
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ width: '100%' }}
        >
          <View style={styles.modalCard}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
                <Text style={{ fontSize: 18, color: '#fff' }}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{initial ? 'EDIT SCHEDULE' : 'ADD SCHEDULE'}</Text>
              <Text style={styles.modalSubtitle}>Set up a recurring bus notification</Text>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* Title */}
              <Text style={styles.fieldLabel}>TITLE</Text>
              <TextInput
                style={styles.fieldInput}
                value={form.title}
                onChangeText={v => set('title', v)}
                placeholder="e.g. Morning commute"
                placeholderTextColor="#AAA"
              />

              {/* Stop + Route */}
              <View style={styles.rowFields}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.fieldLabel}>STOP ID</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={form.origin_stop_id}
                    onChangeText={v => set('origin_stop_id', v)}
                    placeholder="Stop ID"
                    placeholderTextColor="#AAA"
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>ROUTE ID</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={form.route_id}
                    onChangeText={v => set('route_id', v)}
                    placeholder="e.g. A"
                    placeholderTextColor="#AAA"
                  />
                </View>
              </View>

              {/* Direction + Lead time */}
              <View style={styles.rowFields}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.fieldLabel}>DIRECTION</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={form.direction_id}
                    onChangeText={v => set('direction_id', v)}
                    placeholder="Direction ID"
                    placeholderTextColor="#AAA"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>ALERT (MIN)</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={String(form.notify_lead_time_min)}
                    onChangeText={v => set('notify_lead_time_min', v)}
                    placeholder="10"
                    placeholderTextColor="#AAA"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* Depart time */}
              <Text style={styles.fieldLabel}>DEPART TIME</Text>
              <TextInput
                style={styles.fieldInput}
                value={form.depart_time_local}
                onChangeText={v => set('depart_time_local', v)}
                placeholder="HH:MM (e.g. 08:30)"
                placeholderTextColor="#AAA"
              />

              {/* Days */}
              <Text style={styles.fieldLabel}>REPEAT DAYS</Text>
              <View style={styles.daysSelector}>
                {DAY_OPTIONS.map((d, i) => (
                  <TouchableOpacity
                    key={d}
                    style={[styles.daySelectorChip, form.days.includes(d) && styles.daySelectorChipActive]}
                    onPress={() => toggleDay(d)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.daySelectorText, form.days.includes(d) && styles.daySelectorTextActive]}>
                      {DAY_SHORT[i]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={{ height: 16 }} />
            </ScrollView>

            {/* Buttons */}
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.8}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, loading && { opacity: 0.7 }]}
                onPress={() => onSave(form)}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.saveBtnText}>✓  Save Schedule</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function SchedulesScreen({ navigation }) {
  const [session, setSession]         = useState(null);
  const [schedules, setSchedules]     = useState([]);
  const [loading, setLoading]         = useState(true);
  const [submitting, setSubmitting]   = useState(false);
  const [apiError, setApiError]       = useState('');
  const [showForm, setShowForm]       = useState(false);
  const [editTarget, setEditTarget]   = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchSchedules();
      else setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (s) fetchSchedules();
      else { setSchedules([]); setLoading(false); }
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchSchedules = useCallback(async () => {
    setApiError('');
    setLoading(true);
    try {
      const data = await getSchedules(getToken);
      const enriched = await Promise.all(
        (Array.isArray(data) ? data : []).map(async (s) => {
          try {
            const times = await getScheduleTimes(s.id, getToken);
            const days = Array.isArray(times) ? times.map(t => t.day) : [];
            const depart = Array.isArray(times) && times.length
              ? times[0].depart_time_local?.slice(0, 5)
              : '';
            return { ...s, _days: days, _depart: depart };
          } catch { return s; }
        })
      );
      setSchedules(enriched);
    } catch (e) {
      setApiError(e.message || 'Failed to load schedules.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSave = async (form) => {
    setSubmitting(true);
    setApiError('');
    try {
      const body = {
        ...form,
        notify_lead_time_min: parseInt(form.notify_lead_time_min, 10) || 10,
      };
      if (editTarget) {
        await updateSchedule(editTarget.id, body, getToken);
      } else {
        await createSchedule(body, getToken);
      }
      setShowForm(false);
      setEditTarget(null);
      fetchSchedules();
    } catch (e) {
      setApiError(e.message || 'Failed to save schedule.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    setApiError('');
    try {
      await deleteSchedule(id, getToken);
      fetchSchedules();
    } catch (e) {
      setApiError(e.message || 'Failed to delete.');
    }
  };

  const openEdit = (schedule) => {
    setEditTarget(schedule);
    setShowForm(true);
  };

  const openCreate = () => {
    setEditTarget(null);
    setShowForm(true);
  };

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
        {session && (
          <TouchableOpacity style={styles.addBtn} onPress={openCreate} activeOpacity={0.8}>
            <Text style={styles.addBtnText}>＋</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Page title */}
      <View style={styles.pageTitleRow}>
        <Text style={styles.pageTitleIcon}>📅</Text>
        <Text style={styles.pageTitle}>SCHEDULES</Text>
      </View>

      {/* Not logged in */}
      {!session && !loading && (
        <View style={styles.gateBox}>
          <Text style={styles.gateIcon}>🔒</Text>
          <Text style={styles.gateTitle}>Sign in to manage schedules</Text>
          <Text style={styles.gateSub}>
            Save your bus routines and get notified when your bus is arriving.
          </Text>
          <TouchableOpacity
            style={styles.signInBtn}
            onPress={() => navigation.navigate('Auth')}
            activeOpacity={0.85}
          >
            <Text style={styles.signInBtnText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Loading */}
      {loading && (
        <View style={styles.centerBox}>
          <ActivityIndicator color="#3B5BDB" size="large" />
          <Text style={styles.loadingText}>Loading schedules...</Text>
        </View>
      )}

      {/* Error */}
      {apiError !== '' && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>⚠️ {apiError}</Text>
        </View>
      )}

      {/* Schedules list */}
      {session && !loading && (
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {schedules.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>📅</Text>
              <Text style={styles.emptyTitle}>No schedules yet</Text>
              <Text style={styles.emptySub}>Tap ＋ to add your first bus routine</Text>
              <TouchableOpacity style={styles.createFirstBtn} onPress={openCreate} activeOpacity={0.85}>
                <Text style={styles.createFirstBtnText}>＋  Add Schedule</Text>
              </TouchableOpacity>
            </View>
          ) : (
            schedules.map(s => (
              <ScheduleCard key={s.id} schedule={s} onEdit={openEdit} onDelete={handleDelete} />
            ))
          )}
          <View style={{ height: 20 }} />
        </ScrollView>
      )}

      {/* Form modal */}
      <ScheduleFormModal
        visible={showForm}
        initial={editTarget
          ? {
              title: editTarget.title ?? '',
              origin_stop_id: editTarget.origin_stop_id ?? '',
              route_id: editTarget.route_id ?? '',
              direction_id: editTarget.direction_id ?? '',
              notify_lead_time_min: String(editTarget.notify_lead_time_min ?? 10),
              depart_time_local: editTarget._depart ?? '',
              days: editTarget._days ?? [],
            }
          : null
        }
        onClose={() => { setShowForm(false); setEditTarget(null); }}
        onSave={handleSave}
        loading={submitting}
      />

      <TabBar active="plan" navigation={navigation} />
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
  addBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  addBtnText: { fontSize: 22, color: '#fff', fontWeight: '700' },

  pageTitleRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14, gap: 10,
  },
  pageTitleIcon: { fontSize: 22 },
  pageTitle: { fontSize: 26, fontWeight: '900', letterSpacing: 2, color: '#1A1A2E' },

  scroll: { flex: 1, paddingHorizontal: 16 },

  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: '#888' },

  gateBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 12 },
  gateIcon: { fontSize: 48 },
  gateTitle: { fontSize: 20, fontWeight: '900', color: '#1A1A2E', textAlign: 'center' },
  gateSub: { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 22 },
  signInBtn: {
    backgroundColor: '#3B5BDB', borderRadius: 50,
    paddingVertical: 14, paddingHorizontal: 32, marginTop: 8,
  },
  signInBtnText: { fontSize: 15, fontWeight: '800', color: '#fff' },

  emptyBox: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '900', color: '#1A1A2E' },
  emptySub: { fontSize: 14, color: '#AAA' },
  createFirstBtn: {
    backgroundColor: '#3B5BDB', borderRadius: 50,
    paddingVertical: 14, paddingHorizontal: 28, marginTop: 16,
  },
  createFirstBtnText: { fontSize: 14, fontWeight: '800', color: '#fff' },

  errorBanner: {
    backgroundColor: '#FFF0F0', marginHorizontal: 16, borderRadius: 12, padding: 12, marginBottom: 8,
  },
  errorBannerText: { fontSize: 13, color: '#E53935', fontWeight: '600' },

  // Schedule card
  scheduleCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  scheduleCardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  scheduleCardLeft: { flex: 1 },
  scheduleTitle: { fontSize: 15, fontWeight: '800', color: '#1A1A2E', marginBottom: 4 },
  scheduleMeta: { fontSize: 12, color: '#888', marginBottom: 2 },
  scheduleCardActions: { flexDirection: 'row', gap: 8 },
  editBtn: {
    backgroundColor: '#EEF2FF', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 7,
  },
  editBtnText: { fontSize: 12, fontWeight: '700', color: '#3B5BDB' },
  deleteBtn: {
    backgroundColor: '#FFF0F0', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 7,
  },
  deleteBtnText: { fontSize: 12, fontWeight: '700', color: '#E53935' },
  daysRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  dayChip: {
    width: 36, height: 28, borderRadius: 8,
    backgroundColor: '#F5F6FA', alignItems: 'center', justifyContent: 'center',
  },
  dayChipActive: { backgroundColor: '#3B5BDB' },
  dayChipText: { fontSize: 11, fontWeight: '700', color: '#AAA' },
  dayChipTextActive: { color: '#fff' },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    overflow: 'hidden', maxHeight: '92%',
  },
  modalHeader: {
    backgroundColor: '#3B5BDB',
    paddingHorizontal: 24, paddingTop: 28, paddingBottom: 28, alignItems: 'center',
  },
  modalCloseBtn: { position: 'absolute', top: 16, right: 20, padding: 4 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#fff', letterSpacing: 1, marginBottom: 6 },
  modalSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)', textAlign: 'center' },
  modalBody: { paddingHorizontal: 20, paddingTop: 20 },
  fieldLabel: { fontSize: 11, fontWeight: '800', color: '#AAA', letterSpacing: 1, marginBottom: 8 },
  fieldInput: {
    backgroundColor: '#F5F6FA', borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 13,
    fontSize: 14, color: '#1A1A2E', marginBottom: 16,
  },
  rowFields: { flexDirection: 'row' },
  daysSelector: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 16 },
  daySelectorChip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
    backgroundColor: '#F0F2F8',
  },
  daySelectorChipActive: { backgroundColor: '#3B5BDB' },
  daySelectorText: { fontSize: 12, fontWeight: '700', color: '#AAA' },
  daySelectorTextActive: { color: '#fff' },
  modalButtons: {
    flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 16, gap: 12,
    borderTopWidth: 1, borderTopColor: '#F0F2F8',
  },
  cancelBtn: {
    flex: 1, paddingVertical: 15, borderRadius: 50,
    borderWidth: 1.5, borderColor: '#E0E0E0', alignItems: 'center',
  },
  cancelBtnText: { fontSize: 14, fontWeight: '700', color: '#1A1A2E' },
  saveBtn: {
    flex: 1.4, flexDirection: 'row', paddingVertical: 15,
    borderRadius: 50, backgroundColor: '#3B5BDB', alignItems: 'center', justifyContent: 'center',
  },
  saveBtnText: { fontSize: 14, fontWeight: '800', color: '#fff' },

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