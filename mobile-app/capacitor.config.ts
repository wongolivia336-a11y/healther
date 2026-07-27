import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.wongolivia.healther",
  appName: "Healther",
  webDir: "dist",
  android: {
    allowMixedContent: false
  },
  plugins: {
    LocalNotifications: {
      smallIcon: "ic_stat_healther",
      iconColor: "#4D7FF1"
    }
  }
};

export default config;
