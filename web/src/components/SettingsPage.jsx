/**
 * Settings: notifications, preferences, appearance (theme).
 * Stored in localStorage; theme applied via data-theme on documentElement.
 */
import { useEffect, useState } from "react";
import "../App.css";

const STORAGE_KEYS = {
  notifications: "unitrans_notifications",
  alertThreshold: "unitrans_alert_threshold",
  pushAlerts: "unitrans_push_alerts",
  inAppAlerts: "unitrans_in_app_alerts",
  sound: "unitrans_sound",
  vibration: "unitrans_vibration",
  theme: "unitrans_theme",
  reducedMotion: "unitrans_reduced_motion",
};

function useStored(key, defaultValue) {
  const [value, setValue] = useState(() => {
    try {
      const v = localStorage.getItem(key);
      return v !== null ? JSON.parse(v) : defaultValue;
    } catch {
      return defaultValue;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn(e);
    }
  }, [key, value]);
  return [value, setValue];
}

export default function SettingsPage() {
  const [notifications, setNotifications] = useStored(STORAGE_KEYS.notifications, true);
  const [alertThreshold, setAlertThreshold] = useStored(STORAGE_KEYS.alertThreshold, "2");
  const [pushAlerts, setPushAlerts] = useStored(STORAGE_KEYS.pushAlerts, true);
  const [inAppAlerts, setInAppAlerts] = useStored(STORAGE_KEYS.inAppAlerts, true);
  const [sound, setSound] = useStored(STORAGE_KEYS.sound, true);
  const [vibration, setVibration] = useStored(STORAGE_KEYS.vibration, true);
  const [theme, setTheme] = useStored(STORAGE_KEYS.theme, "system");
  const [reducedMotion, setReducedMotion] = useStored(STORAGE_KEYS.reducedMotion, false);

  // Apply theme to document (default = dark; data-theme="light" for light)
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "light") root.setAttribute("data-theme", "light");
    else if (theme === "dark") root.removeAttribute("data-theme");
    else {
      const dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (dark) root.removeAttribute("data-theme");
      else root.setAttribute("data-theme", "light");
    }
  }, [theme]);

  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      if (mq.matches) document.documentElement.removeAttribute("data-theme");
      else document.documentElement.setAttribute("data-theme", "light");
    };
    mq.addEventListener("change", apply);
    apply();
    return () => mq.removeEventListener("change", apply);
  }, [theme]);

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>Settings</h2>

      <section className="settings-section">
        <div className="settings-section-header">
          <span>GENERAL</span>
        </div>
        <div className="settings-section-body">
          <div className="settings-row">
            <label>Bus approach alerts & updates</label>
            <button
              type="button"
              className={`toggle ${notifications ? "on" : ""}`}
              onClick={() => setNotifications(!notifications)}
              aria-pressed={notifications}
              aria-label="Enable notifications"
            />
          </div>
          <div className="settings-row">
            <label>Alert threshold</label>
            <select
              value={alertThreshold}
              onChange={(e) => setAlertThreshold(e.target.value)}
              aria-label="Alert threshold"
            >
              <option value="1">1 stop away</option>
              <option value="2">2 stops away</option>
              <option value="3">3 stops away</option>
            </select>
          </div>
        </div>
      </section>

      <section className="settings-section">
        <div className="settings-section-header">
          <span>PREFERENCES</span>
        </div>
        <div className="settings-section-body">
          <div className="settings-row">
            <label>Push alerts</label>
            <button type="button" className={`toggle ${pushAlerts ? "on" : ""}`} onClick={() => setPushAlerts(!pushAlerts)} aria-pressed={pushAlerts} />
          </div>
          <div className="settings-row">
            <label>In-app alerts</label>
            <button type="button" className={`toggle ${inAppAlerts ? "on" : ""}`} onClick={() => setInAppAlerts(!inAppAlerts)} aria-pressed={inAppAlerts} />
          </div>
          <div className="settings-row">
            <label>Sound</label>
            <button type="button" className={`toggle ${sound ? "on" : ""}`} onClick={() => setSound(!sound)} aria-pressed={sound} />
          </div>
          <div className="settings-row">
            <label>Vibration</label>
            <button type="button" className={`toggle ${vibration ? "on" : ""}`} onClick={() => setVibration(!vibration)} aria-pressed={vibration} />
          </div>
        </div>
      </section>

      <section className="settings-section">
        <div className="settings-section-header">
          <span>APPEARANCE</span>
        </div>
        <div className="settings-section-body">
          <div className="settings-row">
            <label>Selected theme</label>
          </div>
          <div className="theme-options">
            {["light", "dark", "system"].map((t) => (
              <button
                key={t}
                type="button"
                className={`theme-option ${theme === t ? "active" : ""}`}
                onClick={() => setTheme(t)}
              >
                <span>{t === "light" ? "☀" : t === "dark" ? "🌙" : "🖥"}</span>
                <span>{t.toUpperCase()}</span>
              </button>
            ))}
          </div>
          <div className="settings-row" style={{ marginTop: 12 }}>
            <label>Simplify animations (reduced motion)</label>
            <button type="button" className={`toggle ${reducedMotion ? "on" : ""}`} onClick={() => setReducedMotion(!reducedMotion)} aria-pressed={reducedMotion} />
          </div>
        </div>
      </section>

      <section style={{ marginTop: 24, padding: 16, background: "var(--bg-card)", borderRadius: 12, border: "1px solid var(--border)" }}>
        <div style={{ color: "var(--success)", fontWeight: 600, marginBottom: 8 }}>ACCESSIBILITY FEATURES ACTIVE</div>
        <ul style={{ margin: 0, paddingLeft: 20, color: "var(--text-muted)", fontSize: "0.9rem" }}>
          <li>Pattern-based identification for color contrast</li>
          <li>Calendar-based scheduling for consistency</li>
          <li>Clear labels and navigation</li>
        </ul>
      </section>
    </div>
  );
}
