import notifier from "node-notifier";

interface AlertInfo {
  level: string;
  message: string;
  type: string;
}

export function sendDesktopNotification(alert: AlertInfo): void {
  try {
    notifier.notify({
      title:
        alert.level === "critical"
          ? "Critical Budget Alert"
          : "Budget Warning",
      message: alert.message,
      sound: true,
      wait: false,
      timeout: 10,
    });
  } catch (error) {
    console.error(
      "[desktop-notifier] Failed to send notification:",
      error instanceof Error ? error.message : String(error)
    );
  }
}
