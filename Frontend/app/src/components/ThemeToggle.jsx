import useTheme from "../theme/themes";
import "./ThemeToggle.css";

/**
 * Standalone so it can live wherever it fits best — currently rendered
 * by Home, but it can be dropped into HomeNavbar with a single import
 * and no other changes. The state lives in <html data-theme>, not in a
 * React context, so two instances would stay in sync anyway.
 */
function ThemeToggle({ className = "" }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      className={`theme-toggle ${className}`.trim()}
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      aria-pressed={isDark}
      title={isDark ? "Light theme" : "Dark theme"}
    >
      <span className="theme-toggle-track" aria-hidden="true">
        <span className="theme-toggle-icon sun">
          <svg viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="4.2" />
            <path d="M12 2.6v2.2M12 19.2v2.2M2.6 12h2.2M19.2 12h2.2M5.4 5.4l1.6 1.6M17 17l1.6 1.6M18.6 5.4L17 7M7 17l-1.6 1.6" />
          </svg>
        </span>
        <span className="theme-toggle-icon moon">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M20 13.4A8.2 8.2 0 1 1 10.6 4a6.6 6.6 0 0 0 9.4 9.4z" />
          </svg>
        </span>
      </span>
    </button>
  );
}

export default ThemeToggle;