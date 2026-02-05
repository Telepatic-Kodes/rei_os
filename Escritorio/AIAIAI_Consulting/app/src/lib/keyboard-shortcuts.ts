/**
 * Global keyboard shortcuts system
 * Handles keyboard navigation throughout the app
 */

export type ShortcutHandler = (e: KeyboardEvent) => void;

export interface Shortcut {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
  handler: ShortcutHandler;
}

class KeyboardShortcutManager {
  private shortcuts: Shortcut[] = [];
  private isListening = false;

  register(shortcut: Shortcut) {
    // Dedup: replace existing shortcut with same key combo to prevent duplicates on remount
    const idx = this.shortcuts.findIndex(
      (s) =>
        s.key === shortcut.key &&
        s.ctrl === shortcut.ctrl &&
        s.meta === shortcut.meta &&
        s.shift === shortcut.shift &&
        s.alt === shortcut.alt
    );
    if (idx !== -1) {
      this.shortcuts[idx] = shortcut;
    } else {
      this.shortcuts.push(shortcut);
    }
  }

  unregister(key: string) {
    this.shortcuts = this.shortcuts.filter((s) => s.key !== key);
  }

  private matchesShortcut(e: KeyboardEvent, shortcut: Shortcut): boolean {
    if (shortcut.key.toLowerCase() !== e.key.toLowerCase()) return false;
    if (shortcut.ctrl && !e.ctrlKey) return false;
    if (shortcut.meta && !e.metaKey) return false;
    if (shortcut.shift && !e.shiftKey) return false;
    if (shortcut.alt && !e.altKey) return false;
    return true;
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs
    const target = e.target as HTMLElement;
    if (
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.isContentEditable
    ) {
      // Exception: Allow Ctrl+K even in inputs
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        // Let it pass through
      } else {
        return;
      }
    }

    for (const shortcut of this.shortcuts) {
      if (this.matchesShortcut(e, shortcut)) {
        e.preventDefault();
        shortcut.handler(e);
        break;
      }
    }
  };

  startListening() {
    if (this.isListening) return;
    document.addEventListener("keydown", this.handleKeyDown);
    this.isListening = true;
  }

  stopListening() {
    if (!this.isListening) return;
    document.removeEventListener("keydown", this.handleKeyDown);
    this.isListening = false;
  }

  getShortcuts(): Shortcut[] {
    return [...this.shortcuts];
  }
}

// Singleton instance
export const shortcutManager = new KeyboardShortcutManager();

/**
 * React hook for keyboard shortcuts
 */
export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  if (typeof window === "undefined") return;

  // Register shortcuts on mount
  shortcuts.forEach((shortcut) => {
    shortcutManager.register(shortcut);
  });

  // Cleanup on unmount
  return () => {
    shortcuts.forEach((shortcut) => {
      shortcutManager.unregister(shortcut.key);
    });
  };
}

/**
 * Format shortcut for display
 */
export function formatShortcut(shortcut: Shortcut): string {
  const parts: string[] = [];
  if (shortcut.ctrl) parts.push("Ctrl");
  if (shortcut.meta) parts.push("⌘");
  if (shortcut.shift) parts.push("Shift");
  if (shortcut.alt) parts.push("Alt");
  parts.push(shortcut.key.toUpperCase());
  return parts.join("+");
}
