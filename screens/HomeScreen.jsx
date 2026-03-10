import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  ScrollView,
  Modal,
} from 'react-native';

// ─── Constants ────────────────────────────────────────────────────────────────
const POPULAR_LOCATIONS = [
  'Memorial Union',
  'Silo Terminal',
  'ARC',
  'Shields Library',
];

const RECENT_SEARCHES = [
  'Memorial Union',
  'Silo Terminal',
  'ARC',
  'Shields Library',
];

const TRANSPORT_MODES = [
  { key: 'bus',  label: 'BUS',  icon: '🚌' }
];

const ROUTE_DATA = {
  bus: {
    time: 12,
    sections: [
      {
        type: 'bus',
        stopLabel: 'SILO TERMINAL',
        stopSub: 'Board A Line',
        lineName: 'A LINE',
        lineCode: 'A',
        stops: 4,
        duration: '12 min',
        departs: '10:44 AM',
        arrivalLabel: 'MEMORIAL UNION',
        arrivalSub: 'Closest stop to Memorial Union',
        arrives: '10:56 AM',
      },
    ]
  }
};

// ─── Tab Bar ──────────────────────────────────────────────────────────────────
const TabBar = ({ active = 'home' }) => {
  const tabs = [
    { key: 'home',     label: 'HOME',   icon: '⌂' },
    { key: 'routes',   label: 'ROUTES', icon: '🗺' },
    { key: 'plan',     label: 'PLAN',   icon: '📅' },
    { key: 'settings', label: 'SET',    icon: '⚙️' },
  ];
  return (
    <View style={styles.tabBar}>
      {tabs.map((tab) => (
        <TouchableOpacity key={tab.key} style={styles.tabItem} activeOpacity={0.7}>
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

// ─── Notification Modal ───────────────────────────────────────────────────────
const NotifModal = ({ visible, onEnable, onDecline, onLater }) => (
  <Modal transparent visible={visible} animationType="fade">
    <View style={styles.modalOverlay}>
      <View style={styles.modalCard}>
        <TouchableOpacity style={styles.modalClose} onPress={onDecline}>
          <Text style={styles.modalCloseText}>✕</Text>
        </TouchableOpacity>

        <View style={styles.modalBellCircle}>
          <Text style={{ fontSize: 28 }}>🔔</Text>
        </View>

        <Text style={styles.modalTitle}>Welcome to UC Davis Unitrans!</Text>
        <Text style={styles.modalSubtitle}>
          Would you like to enable notifications for bus schedules and stop alerts?
        </Text>

        <View style={styles.modalInfoBox}>
          <Text style={{ fontSize: 22, marginRight: 12, color: '#3B5BDB' }}>🔔</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.modalInfoTitle}>Stay informed about your bus</Text>
            <Text style={styles.modalInfoBody}>
              Notifications help you know when your bus is arriving, if there are delays, and when to head to your stop. You can customize these settings anytime.
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.modalPrimaryBtn} onPress={onEnable} activeOpacity={0.85}>
          <Text style={{ fontSize: 16, marginRight: 8 }}>🔔</Text>
          <Text style={styles.modalPrimaryBtnText}>Yes, Enable Notifications</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.modalSecondaryBtn} onPress={onDecline} activeOpacity={0.8}>
          <Text style={styles.modalSecondaryBtnText}>No, Thanks</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.modalTertiaryBtn} onPress={onLater} activeOpacity={0.7}>
          <Text style={{ fontSize: 14, marginRight: 6 }}>⚙️</Text>
          <Text style={styles.modalTertiaryBtnText}>I'll configure this later in Settings</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

// ─── Toast Banner ─────────────────────────────────────────────────────────────
const ToastBanner = ({ message, visible }) => {
  if (!visible) return null;
  return (
    <View style={styles.toast}>
      <Text style={{ fontSize: 16, marginRight: 8 }}>✅</Text>
      <Text style={styles.toastText}>{message}</Text>
    </View>
  );
};

// ─── Map Placeholder ──────────────────────────────────────────────────────────
const MapPlaceholder = () => (
  <View style={styles.mapContainer}>
    <View style={styles.mapBg}>
      {/* Vintage map simulation with grid lines */}
      <Text style={styles.mapBgEmoji}>🗺</Text>
    </View>
    <View style={styles.mapControls}>
      <TouchableOpacity style={styles.mapControlBtn} activeOpacity={0.8}>
        <Text style={styles.mapControlText}>＋</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.mapControlBtn} activeOpacity={0.8}>
        <Text style={styles.mapControlText}>－</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.mapControlBtn, { borderColor: '#3B5BDB' }]} activeOpacity={0.8}>
        <Text style={[styles.mapControlText, { color: '#3B5BDB' }]}>◎</Text>
      </TouchableOpacity>
    </View>
    <View style={styles.mapCenterCard}>
      <Text style={{ fontSize: 36, color: '#AAB4C8', marginBottom: 10 }}>📍</Text>
      <Text style={styles.mapCenterText}>Search for a destination to begin</Text>
    </View>
  </View>
);

// ─── Search Panel ─────────────────────────────────────────────────────────────
const SearchPanel = ({ onSelect, onClose }) => {
  const [query, setQuery] = useState('');

  const filterList = (list) =>
    query.trim() === ''
      ? list
      : list.filter((l) => l.toLowerCase().includes(query.toLowerCase()));

  return (
    <View style={styles.searchPanel}>
      {/* Search bar row */}
      <View style={styles.searchBarRow}>
        <TouchableOpacity onPress={onClose} style={{ padding: 6 }}>
          <Text style={{ fontSize: 18, color: '#666', fontWeight: '700' }}>✕</Text>
        </TouchableOpacity>
        <View style={styles.searchInputBox}>
          <Text style={{ fontSize: 16, color: '#AAA', marginRight: 8 }}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search for a destination..."
            placeholderTextColor="#AAA"
            value={query}
            onChangeText={setQuery}
            autoFocus
          />
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Use current location */}
        <TouchableOpacity
          style={styles.currentLocationRow}
          activeOpacity={0.85}
          onPress={() => onSelect('Current Location')}
        >
          <View style={styles.currentLocationIcon}>
            <Text style={{ fontSize: 20, color: '#fff' }}>➤</Text>
          </View>
          <View>
            <Text style={styles.currentLocationTitle}>USE CURRENT LOCATION</Text>
            <Text style={styles.currentLocationSub}>Finding your location...</Text>
          </View>
        </TouchableOpacity>

        {/* Recent */}
        <Text style={styles.searchSectionLabel}>RECENT</Text>
        {filterList(RECENT_SEARCHES).map((item) => (
          <TouchableOpacity
            key={`recent-${item}`}
            style={styles.searchResultRow}
            onPress={() => onSelect(item)}
            activeOpacity={0.7}
          >
            <Text style={styles.searchResultIcon}>🕐</Text>
            <Text style={styles.searchResultText}>{item}</Text>
          </TouchableOpacity>
        ))}

        {/* Popular */}
        <Text style={[styles.searchSectionLabel, { marginTop: 16 }]}>POPULAR LOCATIONS</Text>
        {filterList(POPULAR_LOCATIONS).map((item) => (
          <TouchableOpacity
            key={`pop-${item}`}
            style={styles.searchResultRow}
            onPress={() => onSelect(item)}
            activeOpacity={0.7}
          >
            <Text style={styles.searchResultIcon}>📍</Text>
            <Text style={styles.searchResultText}>{item}</Text>
          </TouchableOpacity>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

// ─── Bus Route Card ───────────────────────────────────────────────────────────
const BusRouteSection = ({ section }) => (
  <View>
    {/* Start stop */}
    <View style={styles.stepRow}>
      <View style={styles.stepLeft}>
        <View style={[styles.stepIconCircle, { backgroundColor: '#3B5BDB' }]}>
          <Text style={{ fontSize: 18 }}>🚌</Text>
        </View>
        <View style={styles.stepLine} />
      </View>
      <View style={styles.stepContent}>
        <Text style={styles.stepLabel}>{section.stopLabel}</Text>
        <Text style={styles.stepSub}>{section.stopSub}</Text>

        {/* Line card */}
        <View style={styles.lineCard}>
          <View style={styles.lineCodeBox}>
            <Text style={styles.lineCodeLetter}>{section.lineCode}</Text>
            <Text style={styles.lineCodeWord}>LINE</Text>
          </View>
          <View style={styles.lineInfo}>
            <Text style={styles.lineName}>{section.lineName}</Text>
            <View style={styles.lineMetaRow}>
              <Text style={styles.lineMeta}>{section.stops} stops</Text>
              <Text style={[styles.lineMeta, { marginLeft: 12 }]}>{section.duration}</Text>
            </View>
          </View>
        </View>

        {section.departs && (
          <View style={styles.timeRow}>
            <Text style={styles.timeRowIcon}>🕐</Text>
            <Text style={styles.timeRowText}>DEPARTS {section.departs}</Text>
          </View>
        )}
      </View>
    </View>

    {/* End stop */}
    <View style={[styles.stepRow, { marginTop: 8 }]}>
      <View style={styles.stepLeft}>
        <View style={[styles.stepIconCircle, { backgroundColor: '#E53935' }]}>
          <Text style={{ fontSize: 18 }}>📍</Text>
        </View>
      </View>
      <View style={styles.stepContent}>
        <Text style={styles.stepLabel}>{section.arrivalLabel}</Text>
        <Text style={styles.stepSub}>{section.arrivalSub}</Text>
        {section.arrives && (
          <View style={styles.timeRow}>
            <Text style={styles.timeRowIcon}>🕐</Text>
            <Text style={styles.timeRowText}>ARRIVES {section.arrives}</Text>
          </View>
        )}
      </View>
    </View>
  </View>
);

// Simple step (walk/bike/car)
const SimpleRouteSection = ({ section }) => (
  <View>
    <View style={styles.stepRow}>
      <View style={styles.stepLeft}>
        <View style={[styles.stepIconCircle, { backgroundColor: '#E8ECF0' }]}>
          <Text style={{ fontSize: 18 }}>🧍</Text>
        </View>
        <View style={styles.stepLine} />
      </View>
      <View style={styles.stepContent}>
        <Text style={styles.stepLabel}>{section.stopLabel}</Text>
        <Text style={styles.stepSub}>{section.stopSub}</Text>
      </View>
    </View>
    <View style={[styles.stepRow, { marginTop: 8 }]}>
      <View style={styles.stepLeft}>
        <View style={[styles.stepIconCircle, { backgroundColor: '#E53935' }]}>
          <Text style={{ fontSize: 18 }}>📍</Text>
        </View>
      </View>
      <View style={styles.stepContent}>
        <Text style={styles.stepLabel}>{section.arrivalLabel}</Text>
        <Text style={styles.stepSub}>{section.arrivalSub}</Text>
      </View>
    </View>
  </View>
);

// ─── Add Routine Modal ────────────────────────────────────────────────────────
const WEEK_DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const DAY_KEYS  = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const CAL_DAYS  = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS    = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const REPEAT_OPTIONS = ['Daily', 'Weekly', 'Custom Days'];
const HOURS     = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
const MINUTES   = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

// Build calendar grid for a given month/year
const buildCalendar = (year, month) => {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  return cells;
};

const AddRoutineModal = ({ visible, destination, onClose, onSave }) => {
  const today = new Date();
  const [selectedDays, setSelectedDays] = useState({ mon: true, wed: true, fri: true });
  const [pushNotifs, setPushNotifs]     = useState(true);
  const [repeat, setRepeat]             = useState('Weekly');
  const [showRepeatMenu, setShowRepeatMenu] = useState(false);
  const [calYear, setCalYear]           = useState(today.getFullYear());
  const [calMonth, setCalMonth]         = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(today.getDate());
  const [showCal, setShowCal]           = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [hour, setHour]                 = useState('08');
  const [minute, setMinute]             = useState('00');
  const [ampm, setAmpm]                 = useState('AM');

  const toggleDay = (key) => setSelectedDays((p) => ({ ...p, [key]: !p[key] }));

  const formattedDate = `${MONTHS[calMonth].slice(0, 3)} ${selectedDate}`;
  const formattedTime = `${hour}:${minute} ${ampm}`;

  const calCells = buildCalendar(calYear, calMonth);

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
    else setCalMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
    else setCalMonth(m => m + 1);
  };

  return (
    <Modal transparent visible={visible} animationType="slide">
      <View style={styles.routineOverlay}>
        <View style={styles.routineCard}>

          {/* ── Blue Header ── */}
          <View style={styles.routineHeader}>
            <TouchableOpacity style={styles.routineClose} onPress={onClose}>
              <Text style={{ fontSize: 18, color: '#fff' }}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.routineTitle}>ADD ROUTINE</Text>
            <Text style={styles.routineSubtitle}>
              Establish a routine for Current Location to {destination}
            </Text>
          </View>

          <ScrollView style={styles.routineBody} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

            {/* ── START DATE + TIME ── */}
            <View style={styles.routineRow}>
              {/* Date field */}
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={styles.routineFieldLabel}>START DATE</Text>
                <TouchableOpacity
                  style={styles.routineFieldBox}
                  onPress={() => { setShowCal(!showCal); setShowTimePicker(false); setShowRepeatMenu(false); }}
                  activeOpacity={0.8}
                >
                  <Text style={{ fontSize: 16, marginRight: 8 }}>📅</Text>
                  <Text style={styles.routineFieldText}>{formattedDate}</Text>
                </TouchableOpacity>
              </View>

              {/* Time field */}
              <View style={{ flex: 1 }}>
                <Text style={styles.routineFieldLabel}>TIME</Text>
                <TouchableOpacity
                  style={styles.routineFieldBox}
                  onPress={() => { setShowTimePicker(!showTimePicker); setShowCal(false); setShowRepeatMenu(false); }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.routineFieldText, { flex: 1 }]}>{formattedTime}</Text>
                  <Text style={{ fontSize: 18 }}>🕐</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* ── CALENDAR PICKER ── */}
            {showCal && (
              <View style={styles.calendarBox}>
                {/* Month nav */}
                <View style={styles.calNavRow}>
                  <TouchableOpacity onPress={prevMonth} style={styles.calNavBtn}>
                    <Text style={styles.calNavArrow}>‹</Text>
                  </TouchableOpacity>
                  <Text style={styles.calMonthLabel}>{MONTHS[calMonth]} {calYear}</Text>
                  <TouchableOpacity onPress={nextMonth} style={styles.calNavBtn}>
                    <Text style={styles.calNavArrow}>›</Text>
                  </TouchableOpacity>
                </View>
                {/* Day headers */}
                <View style={styles.calHeaderRow}>
                  {CAL_DAYS.map(d => (
                    <Text key={d} style={styles.calDayHeader}>{d}</Text>
                  ))}
                </View>
                {/* Date grid */}
                <View style={styles.calGrid}>
                  {calCells.map((cell, i) => {
                    const isToday = cell === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear();
                    const isSelected = cell === selectedDate && calMonth === calMonth;
                    return (
                      <TouchableOpacity
                        key={i}
                        style={[
                          styles.calCell,
                          isSelected && styles.calCellSelected,
                        ]}
                        onPress={() => { if (cell) { setSelectedDate(cell); setShowCal(false); } }}
                        activeOpacity={cell ? 0.7 : 1}
                      >
                        <Text style={[
                          styles.calCellText,
                          !cell && { opacity: 0 },
                          isSelected && styles.calCellTextSelected,
                        ]}>
                          {cell || '·'}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* ── TIME PICKER ── */}
            {showTimePicker && (
              <View style={styles.timePickerBox}>
                {/* Hours scroll */}
                <ScrollView style={styles.timePickerCol} showsVerticalScrollIndicator={false} nestedScrollEnabled>
                  {HOURS.map(h => (
                    <TouchableOpacity
                      key={h}
                      style={[styles.timePickerItem, hour === h && styles.timePickerItemActive]}
                      onPress={() => setHour(h)}
                    >
                      <Text style={[styles.timePickerText, hour === h && styles.timePickerTextActive]}>{h}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                {/* Minutes scroll */}
                <ScrollView style={styles.timePickerCol} showsVerticalScrollIndicator={false} nestedScrollEnabled>
                  {MINUTES.filter((_, i) => i % 1 === 0).map(m => (
                    <TouchableOpacity
                      key={m}
                      style={[styles.timePickerItem, minute === m && styles.timePickerItemActive]}
                      onPress={() => setMinute(m)}
                    >
                      <Text style={[styles.timePickerText, minute === m && styles.timePickerTextActive]}>{m}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                {/* AM/PM */}
                <View style={styles.timePickerAmPm}>
                  {['AM', 'PM'].map(p => (
                    <TouchableOpacity
                      key={p}
                      style={[styles.ampmBtn, ampm === p && styles.ampmBtnActive]}
                      onPress={() => setAmpm(p)}
                    >
                      <Text style={[styles.ampmText, ampm === p && styles.ampmTextActive]}>{p}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* ── REPEAT ── */}
            <Text style={[styles.routineFieldLabel, { marginTop: 16 }]}>REPEAT</Text>
            <TouchableOpacity
              style={[styles.routineFieldBox, { justifyContent: 'space-between' }]}
              onPress={() => { setShowRepeatMenu(!showRepeatMenu); setShowCal(false); setShowTimePicker(false); }}
              activeOpacity={0.8}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 16, marginRight: 10 }}>🔄</Text>
                <Text style={styles.routineFieldText}>{repeat}</Text>
              </View>
              <Text style={{ fontSize: 18, color: '#AAA' }}>{showRepeatMenu ? '∧' : '⌄'}</Text>
            </TouchableOpacity>

            {/* Repeat dropdown */}
            {showRepeatMenu && (
              <View style={styles.repeatMenu}>
                {REPEAT_OPTIONS.map((opt, i) => (
                  <TouchableOpacity
                    key={opt}
                    style={[
                      styles.repeatMenuItem,
                      i < REPEAT_OPTIONS.length - 1 && { borderBottomWidth: 1, borderBottomColor: '#F0F2F8' },
                    ]}
                    onPress={() => { setRepeat(opt); setShowRepeatMenu(false); }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.repeatMenuText, repeat === opt && { color: '#3B5BDB', fontWeight: '700' }]}>
                      {opt}
                    </Text>
                    {repeat === opt && <Text style={{ color: '#3B5BDB', fontSize: 16 }}>✓</Text>}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* ── DAYS ── */}
            <Text style={[styles.routineFieldLabel, { marginTop: 16 }]}>DAYS</Text>
            <View style={styles.daysRow}>
              {WEEK_DAYS.map((d, i) => {
                const key = DAY_KEYS[i];
                const active = !!selectedDays[key];
                return (
                  <TouchableOpacity
                    key={`${key}-${i}`}
                    style={[styles.dayCircle, active && styles.dayCircleActive]}
                    onPress={() => toggleDay(key)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.dayLabel, active && styles.dayLabelActive]}>{d}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* ── ALERTS ── */}
            <Text style={[styles.routineFieldLabel, { marginTop: 16 }]}>ALERTS</Text>
            <View style={styles.routineAlertRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 18, color: '#3B5BDB', marginRight: 10 }}>🔔</Text>
                <Text style={styles.routineAlertText}>Push Notifications</Text>
              </View>
              <TouchableOpacity
                onPress={() => setPushNotifs(!pushNotifs)}
                style={[styles.fakeToggle, pushNotifs && styles.fakeToggleOn]}
                activeOpacity={0.8}
              >
                <View style={[styles.fakeToggleThumb, pushNotifs && { alignSelf: 'flex-end' }]} />
              </TouchableOpacity>
            </View>

            <View style={{ height: 20 }} />
          </ScrollView>

          {/* ── Buttons ── */}
          <View style={styles.routineButtons}>
            <TouchableOpacity style={styles.routineCancelBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.routineCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.routineSaveBtn} onPress={onSave} activeOpacity={0.85}>
              <Text style={{ fontSize: 14, color: '#fff', marginRight: 6 }}>✓</Text>
              <Text style={styles.routineSaveText}>Save Routine</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ─── Route Sheet ──────────────────────────────────────────────────────────────
const RouteSheet = ({ destination, onClose }) => {
  const [mode, setMode] = useState('bus');
  const [showRoutine, setShowRoutine] = useState(false);
  const route = ROUTE_DATA[mode];

  return (
    <View style={styles.routeSheet}>
      {/* Add Routine Modal */}
      <AddRoutineModal
        visible={showRoutine}
        destination={destination}
        onClose={() => setShowRoutine(false)}
        onSave={() => setShowRoutine(false)}
      />

      <View style={styles.sheetHandle} />

      {/* Header */}
      <View style={styles.routeHeader}>
        <View>
          <Text style={styles.routeTitle}>YOUR ROUTE</Text>
          <Text style={styles.routeSubtitle}>To {destination}</Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.routeCloseBtn} activeOpacity={0.7}>
          <Text style={{ fontSize: 20, color: '#888' }}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Mode tabs */}
      <View style={styles.modeTabsRow}>
        {TRANSPORT_MODES.map((m) => (
          <TouchableOpacity
            key={m.key}
            style={[styles.modeTab, mode === m.key && styles.modeTabActive]}
            onPress={() => setMode(m.key)}
            activeOpacity={0.8}
          >
            <Text style={[styles.modeTabIcon, mode === m.key && { color: '#3B5BDB' }]}>{m.icon}</Text>
            <Text style={[styles.modeTabLabel, mode === m.key && { color: '#3B5BDB', fontWeight: '800' }]}>
              {m.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Time card */}
      <View style={styles.timeCard}>
        <View>
          <Text style={styles.timeNumber}>{route.time}</Text>
          <Text style={styles.timeUnit}>min</Text>
          <Text style={styles.timeLabel}>TOTAL TIME</Text>
        </View>
        <TouchableOpacity style={styles.addScheduleBtn} onPress={() => setShowRoutine(true)} activeOpacity={0.85}>
          <Text style={styles.addScheduleText}>ADD TO SCHEDULE</Text>
        </TouchableOpacity>
      </View>

      {/* Steps */}
      <ScrollView style={styles.stepsScroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.stepByStepLabel}>
          {mode === 'bus' ? 'BUS ROUTE' : 'STEP-BY-STEP'}
        </Text>
        {route.sections.map((section, i) =>
          section.type === 'bus'
            ? <BusRouteSection key={i} section={section} />
            : <SimpleRouteSection key={i} section={section} />
        )}
        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
};

// ─── Main HomeScreen ──────────────────────────────────────────────────────────
export default function HomeScreen() {
  const [showNotifModal, setShowNotifModal] = useState(true);
  const [showToast, setShowToast]           = useState(false);
  const [toastMsg, setToastMsg]             = useState('');
  const [showSearch, setShowSearch]         = useState(false);
  const [destination, setDestination]       = useState(null);

  // Auto-hide toast after 3s
  useEffect(() => {
    if (showToast) {
      const t = setTimeout(() => setShowToast(false), 3000);
      return () => clearTimeout(t);
    }
  }, [showToast]);

  const handleEnable = () => {
    setShowNotifModal(false);
    setToastMsg('Notifications enabled!');
    setShowToast(true);
  };

  const handleDecline = () => {
    setShowNotifModal(false);
  };

  const handleLater = () => {
    setShowNotifModal(false);
  };

  const handleSelectDestination = (dest) => {
    setDestination(dest);
    setShowSearch(false);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#3B5BDB" />

      {/* ── Notification Modal ── */}
      <NotifModal
        visible={showNotifModal}
        onEnable={handleEnable}
        onDecline={handleDecline}
        onLater={handleLater}
      />

      {/* ── Header Banner ── */}
      {!showSearch && (
        <View style={styles.headerBanner}>
          {/* Toast inside header */}
          {showToast && (
            <ToastBanner message={toastMsg} visible={showToast} />
          )}
          <View style={styles.headerBannerInner}>
            <View>
              <Text style={styles.headerGreeting}>Hey Aggie!</Text>
              <Text style={styles.headerSub}>Where are you headed today?</Text>
            </View>
            <View style={styles.headerBusGhost}>
              <Text style={{ fontSize: 44, opacity: 0.2 }}>🚌</Text>
            </View>
          </View>
        </View>
      )}

      {/* ── Body ── */}
      <View style={styles.body}>
        {showSearch ? (
          <SearchPanel
            onSelect={handleSelectDestination}
            onClose={() => setShowSearch(false)}
          />
        ) : destination ? (
          <RouteSheet
            destination={destination}
            onClose={() => setDestination(null)}
          />
        ) : (
          <View style={{ flex: 1 }}>
            {/* Floating search bar */}
            <TouchableOpacity
              style={styles.searchBarFloat}
              onPress={() => setShowSearch(true)}
              activeOpacity={0.9}
            >
              <Text style={{ fontSize: 18, color: '#AAA', marginRight: 10 }}>🔍</Text>
              <Text style={styles.searchBarPlaceholder}>Where to?</Text>
            </TouchableOpacity>

            <MapPlaceholder />
          </View>
        )}
      </View>

      {/* ── Tab Bar ── */}
      <TabBar active="home" />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F6FA' },

  // Header
  headerBanner: {
    backgroundColor: '#3B5BDB',
    paddingBottom: 18,
  },
  headerBannerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 16,
  },
  headerGreeting: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  headerSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
    fontWeight: '500',
  },
  headerBusGhost: { marginLeft: 16 },

  // Toast
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FFF4',
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  toastText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#166534',
  },

  body: { flex: 1 },

  // Search bar floating
  searchBarFloat: {
    position: 'absolute',
    top: 14,
    left: 16,
    right: 16,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 50,
    paddingHorizontal: 18,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
  },
  searchBarPlaceholder: { fontSize: 16, color: '#AAA', fontWeight: '500' },

  // Map
  mapContainer: { flex: 1, position: 'relative' },
  mapBg: {
    flex: 1,
    backgroundColor: '#D6CFC0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapBgEmoji: { fontSize: 200, opacity: 0.12 },
  mapControls: {
    position: 'absolute',
    right: 14,
    bottom: 80,
    gap: 8,
  },
  mapControlBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  mapControlText: { fontSize: 20, color: '#444', fontWeight: '600' },
  mapCenterCard: {
    position: 'absolute',
    top: '28%',
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.93)',
    borderRadius: 20,
    paddingHorizontal: 30,
    paddingVertical: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    width: '72%',
  },
  mapCenterText: { fontSize: 15, color: '#8A9BB0', fontWeight: '600', textAlign: 'center' },

  // Notification Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 26,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 12,
  },
  modalClose: { position: 'absolute', top: 16, right: 18, padding: 4 },
  modalCloseText: { fontSize: 18, color: '#999' },
  modalBellCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#3B5BDB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1A1A2E',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 18,
    lineHeight: 21,
  },
  modalInfoBox: {
    flexDirection: 'row',
    backgroundColor: '#EEF2FF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    width: '100%',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  modalInfoTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A2E', marginBottom: 6 },
  modalInfoBody: { fontSize: 13, color: '#555', lineHeight: 19 },
  modalPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B5BDB',
    borderRadius: 50,
    paddingVertical: 15,
    width: '100%',
    marginBottom: 10,
  },
  modalPrimaryBtnText: { fontSize: 15, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },
  modalSecondaryBtn: {
    borderRadius: 50,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
  },
  modalSecondaryBtnText: { fontSize: 15, fontWeight: '700', color: '#1A1A2E' },
  modalTertiaryBtn: { flexDirection: 'row', alignItems: 'center' },
  modalTertiaryBtnText: { fontSize: 13, color: '#888', fontWeight: '500' },

  // Search Panel
  searchPanel: { flex: 1, backgroundColor: '#FFFFFF', paddingTop: 16 },
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  searchInputBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#3B5BDB',
    borderRadius: 50,
    paddingHorizontal: 16,
    paddingVertical: 11,
    backgroundColor: '#FAFAFA',
  },
  searchInput: { flex: 1, fontSize: 15, color: '#1A1A2E', fontWeight: '500' },
  currentLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: '#EEF2FF',
    borderRadius: 16,
    padding: 14,
    gap: 14,
  },
  currentLocationIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#3B5BDB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentLocationTitle: { fontSize: 13, fontWeight: '800', color: '#1A1A2E', letterSpacing: 0.5 },
  currentLocationSub: { fontSize: 12, color: '#888', marginTop: 2 },
  searchSectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#AAA',
    letterSpacing: 1.2,
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  searchResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F8',
  },
  searchResultIcon: { fontSize: 18 },
  searchResultText: { fontSize: 15, fontWeight: '600', color: '#1A1A2E' },

  // Route Sheet
  routeSheet: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 10,
    paddingTop: 10,
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: '#DDD', alignSelf: 'center', marginBottom: 14,
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  routeTitle: { fontSize: 22, fontWeight: '900', color: '#1A1A2E', letterSpacing: 0.5 },
  routeSubtitle: { fontSize: 14, color: '#888', marginTop: 2, fontWeight: '500' },
  routeCloseBtn: { padding: 4, marginTop: 2 },

  // Mode tabs
  modeTabsRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    backgroundColor: '#F5F6FA',
    borderRadius: 16,
    padding: 4,
    marginBottom: 16,
    gap: 2,
  },
  modeTab: {
    flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12, gap: 4,
  },
  modeTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  modeTabIcon: { fontSize: 20 },
  modeTabLabel: { fontSize: 10, fontWeight: '700', color: '#AAA', letterSpacing: 0.5 },

  // Time card
  timeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1A1A2E',
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 22,
    marginBottom: 16,
  },
  timeNumber: { fontSize: 52, fontWeight: '900', color: '#FFFFFF', lineHeight: 54 },
  timeUnit: { fontSize: 24, fontWeight: '700', color: '#FFFFFF', lineHeight: 26 },
  timeLabel: { fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: '600', letterSpacing: 1, marginTop: 4 },
  addScheduleBtn: {
    backgroundColor: '#FFFFFF', borderRadius: 50,
    paddingHorizontal: 20, paddingVertical: 14,
  },
  addScheduleText: { fontSize: 12, fontWeight: '800', color: '#1A1A2E', letterSpacing: 0.8 },

  // Steps
  stepsScroll: { flex: 1, paddingHorizontal: 16 },
  stepByStepLabel: {
    fontSize: 11, fontWeight: '800', color: '#AAA', letterSpacing: 1.5, marginBottom: 16,
  },
  stepRow: { flexDirection: 'row' },
  stepLeft: { alignItems: 'center', marginRight: 16, width: 44 },
  stepIconCircle: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  stepLine: {
    width: 2, flex: 1, backgroundColor: '#E0E4EE',
    marginVertical: 4, minHeight: 40,
  },
  stepContent: { flex: 1, paddingBottom: 8 },
  stepLabel: { fontSize: 14, fontWeight: '800', color: '#1A1A2E', letterSpacing: 0.5 },
  stepSub: { fontSize: 13, color: '#888', marginTop: 3, fontWeight: '500' },

  // Line card (bus info)
  lineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderRadius: 14,
    padding: 12,
    marginTop: 10,
    marginBottom: 4,
    gap: 12,
  },
  lineCodeBox: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: '#3B5BDB',
    alignItems: 'center', justifyContent: 'center',
  },
  lineCodeLetter: { fontSize: 20, fontWeight: '900', color: '#fff' },
  lineCodeWord: { fontSize: 9, fontWeight: '700', color: 'rgba(255,255,255,0.7)', letterSpacing: 0.5 },
  lineInfo: { flex: 1 },
  lineName: { fontSize: 14, fontWeight: '800', color: '#3B5BDB' },
  lineMetaRow: { flexDirection: 'row', marginTop: 3 },
  lineMeta: { fontSize: 12, color: '#555', fontWeight: '600' },

  // Time rows
  timeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, marginBottom: 8 },
  timeRowIcon: { fontSize: 12, marginRight: 5 },
  timeRowText: { fontSize: 11, fontWeight: '700', color: '#AAA', letterSpacing: 0.8 },

  // Calendar
  calendarBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8EAF0',
    padding: 12,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  calNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  calNavBtn: { padding: 6 },
  calNavArrow: { fontSize: 22, color: '#555', fontWeight: '600' },
  calMonthLabel: { fontSize: 15, fontWeight: '800', color: '#1A1A2E' },
  calHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 6,
  },
  calDayHeader: {
    width: 36,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: '#AAA',
  },
  calGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  calCellSelected: {
    backgroundColor: '#1A1A2E',
  },
  calCellText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A2E',
  },
  calCellTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  // Time Picker
  timePickerBox: {
    flexDirection: 'row',
    backgroundColor: '#F5F6FA',
    borderRadius: 16,
    marginTop: 8,
    overflow: 'hidden',
    height: 180,
    borderWidth: 1,
    borderColor: '#E8EAF0',
  },
  timePickerCol: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: '#E8EAF0',
  },
  timePickerItem: {
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timePickerItemActive: {
    backgroundColor: '#3B5BDB',
    marginHorizontal: 4,
    borderRadius: 10,
  },
  timePickerText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#555',
  },
  timePickerTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  timePickerAmPm: {
    width: 60,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 20,
  },
  ampmBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#E8EAF0',
  },
  ampmBtnActive: {
    backgroundColor: '#3B5BDB',
  },
  ampmText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#888',
  },
  ampmTextActive: {
    color: '#FFFFFF',
  },

  // Repeat dropdown menu
  repeatMenu: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8EAF0',
    marginTop: 4,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  repeatMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  repeatMenuText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A2E',
  },

  // Add Routine Modal
  routineOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  routineCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    maxHeight: '90%',
  },
  routineHeader: {
    backgroundColor: '#3B5BDB',
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 28,
    alignItems: 'center',
  },
  routineClose: {
    position: 'absolute',
    top: 16,
    right: 20,
    padding: 4,
  },
  routineTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
    marginBottom: 8,
  },
  routineSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 20,
  },
  routineBody: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  routineRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  routineFieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#AAA',
    letterSpacing: 1,
    marginBottom: 8,
  },
  routineFieldBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F6FA',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  routineFieldText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A2E',
    flex: 1,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  dayCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F2F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleActive: {
    backgroundColor: '#3B5BDB',
  },
  dayLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#AAA',
  },
  dayLabelActive: {
    color: '#FFFFFF',
  },
  routineAlertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F6FA',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 4,
  },
  routineAlertText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  fakeToggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#DDD',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  fakeToggleOn: {
    backgroundColor: '#3B5BDB',
    alignItems: 'flex-end',
  },
  fakeToggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  fakeToggleThumbOn: {},
  routineButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F2F8',
  },
  routineCancelBtn: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  routineCancelText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  routineSaveBtn: {
    flex: 1.4,
    flexDirection: 'row',
    paddingVertical: 15,
    borderRadius: 50,
    backgroundColor: '#3B5BDB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  routineSaveText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10, paddingHorizontal: 8,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08, shadowRadius: 10, elevation: 10,
    alignItems: 'center',
  },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 4, gap: 3 },
  tabActiveCircle: {
    backgroundColor: '#3B5BDB', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center', gap: 2,
  },
  tabIcon: { fontSize: 20, color: '#999' },
  tabLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 0.8, color: '#999' },
});