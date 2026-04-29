import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  StatusBar, TextInput, KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator,
} from 'react-native';
import supabase from '../lib/supabase';

export default function AuthScreen({ navigation }) {
  const [session, setSession]     = useState(null);
  const [email, setEmail]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [sent, setSent]           = useState(false);
  const [error, setError]         = useState('');
  const [checking, setChecking]   = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setChecking(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSendLink = async () => {
    if (!email.trim()) { setError('Please enter your email.'); return; }
    setLoading(true);
    setError('');
    const { error: authErr } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: 'unitrans://' },
    });
    setLoading(false);
    if (authErr) {
      setError(authErr.message);
    } else {
      setSent(true);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setSession(null);
    setLoading(false);
    setSent(false);
    setEmail('');
  };

  if (checking) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" backgroundColor="#3B5BDB" />
        <View style={styles.centerBox}>
          <ActivityIndicator color="#3B5BDB" size="large" />
        </View>
      </SafeAreaView>
    );
  }

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

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Signed in state */}
          {session ? (
            <View style={styles.signedInBox}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarLetter}>
                  {session.user.email?.[0]?.toUpperCase() ?? '?'}
                </Text>
              </View>
              <Text style={styles.signedInTitle}>Signed in</Text>
              <Text style={styles.signedInEmail}>{session.user.email}</Text>

              <View style={styles.infoCard}>
                <Text style={styles.infoCardIcon}>🔔</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoCardTitle}>Schedules & notifications</Text>
                  <Text style={styles.infoCardBody}>
                    Manage your saved bus schedules and receive alerts when your bus is approaching.
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.scheduleBtn}
                onPress={() => navigation.navigate('Schedules')}
                activeOpacity={0.85}
              >
                <Text style={styles.scheduleBtnText}>📅  My Schedules</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.signOutBtn}
                onPress={handleSignOut}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading
                  ? <ActivityIndicator color="#E53935" />
                  : <Text style={styles.signOutBtnText}>Sign Out</Text>
                }
              </TouchableOpacity>
            </View>
          ) : sent ? (
            /* Email sent state */
            <View style={styles.sentBox}>
              <View style={styles.sentIconCircle}>
                <Text style={{ fontSize: 32 }}>📧</Text>
              </View>
              <Text style={styles.sentTitle}>Check your email</Text>
              <Text style={styles.sentSubtitle}>
                We sent a magic link to {'\n'}<Text style={styles.sentEmail}>{email}</Text>
              </Text>
              <Text style={styles.sentNote}>
                Tap the link in your email to sign in. You can close this screen.
              </Text>
              <TouchableOpacity
                style={styles.backToLoginBtn}
                onPress={() => { setSent(false); setEmail(''); }}
                activeOpacity={0.8}
              >
                <Text style={styles.backToLoginText}>Use a different email</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Login form */
            <View style={styles.loginBox}>
              <View style={styles.loginIconCircle}>
                <Text style={{ fontSize: 32 }}>🎓</Text>
              </View>
              <Text style={styles.loginTitle}>Sign in to Unitrans</Text>
              <Text style={styles.loginSubtitle}>
                Use your UC Davis email to receive bus arrival notifications and save schedules.
              </Text>

              <View style={styles.infoCard}>
                <Text style={styles.infoCardIcon}>🔒</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoCardTitle}>Passwordless magic link</Text>
                  <Text style={styles.infoCardBody}>
                    We'll send a one-tap sign-in link to your email. No password needed.
                  </Text>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>EMAIL</Text>
                <TextInput
                  style={styles.emailInput}
                  placeholder="you@ucdavis.edu"
                  placeholderTextColor="#AAA"
                  value={email}
                  onChangeText={t => { setEmail(t); setError(''); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {error !== '' && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>⚠️ {error}</Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.sendBtn, loading && { opacity: 0.7 }]}
                onPress={handleSendLink}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.sendBtnText}>📧  Send Magic Link</Text>
                }
              </TouchableOpacity>

              <Text style={styles.disclaimer}>
                By signing in you agree to receive bus notifications. You can unsubscribe anytime in Settings.
              </Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F6FA' },
  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    backgroundColor: '#3B5BDB',
    flexDirection: 'row', alignItems: 'center',
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

  scrollContent: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40 },

  // Login
  loginBox: { alignItems: 'center' },
  loginIconCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  loginTitle: { fontSize: 24, fontWeight: '900', color: '#1A1A2E', marginBottom: 8, textAlign: 'center' },
  loginSubtitle: {
    fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 22, marginBottom: 24,
  },

  infoCard: {
    flexDirection: 'row', backgroundColor: '#EEF2FF',
    borderRadius: 16, padding: 16, marginBottom: 24, width: '100%',
    borderWidth: 1, borderColor: '#C7D2FE', alignItems: 'flex-start', gap: 12,
  },
  infoCardIcon: { fontSize: 22 },
  infoCardTitle: { fontSize: 14, fontWeight: '700', color: '#1A1A2E', marginBottom: 4 },
  infoCardBody: { fontSize: 13, color: '#555', lineHeight: 19 },

  inputGroup: { width: '100%', marginBottom: 16 },
  inputLabel: { fontSize: 11, fontWeight: '800', color: '#AAA', letterSpacing: 1, marginBottom: 8 },
  emailInput: {
    backgroundColor: '#fff', borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, color: '#1A1A2E',
    borderWidth: 1.5, borderColor: '#E0E0E0',
    width: '100%',
  },

  errorBox: {
    backgroundColor: '#FFF0F0', borderRadius: 12,
    padding: 12, marginBottom: 12, width: '100%',
  },
  errorText: { fontSize: 13, color: '#E53935', fontWeight: '600' },

  sendBtn: {
    backgroundColor: '#3B5BDB', borderRadius: 50,
    paddingVertical: 16, width: '100%',
    alignItems: 'center', marginBottom: 16,
  },
  sendBtnText: { fontSize: 15, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },

  disclaimer: { fontSize: 12, color: '#BBB', textAlign: 'center', lineHeight: 18 },

  // Sent
  sentBox: { alignItems: 'center', paddingTop: 20 },
  sentIconCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  sentTitle: { fontSize: 24, fontWeight: '900', color: '#1A1A2E', marginBottom: 10 },
  sentSubtitle: { fontSize: 15, color: '#666', textAlign: 'center', lineHeight: 24, marginBottom: 16 },
  sentEmail: { fontWeight: '800', color: '#1A1A2E' },
  sentNote: {
    fontSize: 13, color: '#AAA', textAlign: 'center', lineHeight: 20,
    marginBottom: 28, paddingHorizontal: 20,
  },
  backToLoginBtn: {
    borderRadius: 50, paddingVertical: 14, paddingHorizontal: 24,
    borderWidth: 1.5, borderColor: '#E0E0E0',
  },
  backToLoginText: { fontSize: 14, fontWeight: '700', color: '#1A1A2E' },

  // Signed in
  signedInBox: { alignItems: 'center', paddingTop: 20 },
  avatarCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#3B5BDB', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  avatarLetter: { fontSize: 32, fontWeight: '900', color: '#fff' },
  signedInTitle: { fontSize: 22, fontWeight: '900', color: '#1A1A2E', marginBottom: 4 },
  signedInEmail: { fontSize: 14, color: '#888', marginBottom: 24 },

  scheduleBtn: {
    backgroundColor: '#3B5BDB', borderRadius: 50,
    paddingVertical: 15, width: '100%', alignItems: 'center', marginBottom: 12,
  },
  scheduleBtnText: { fontSize: 15, fontWeight: '800', color: '#fff' },
  signOutBtn: {
    borderRadius: 50, paddingVertical: 14, width: '100%',
    alignItems: 'center', borderWidth: 1.5, borderColor: '#FFD0CF',
  },
  signOutBtnText: { fontSize: 15, fontWeight: '700', color: '#E53935' },
});