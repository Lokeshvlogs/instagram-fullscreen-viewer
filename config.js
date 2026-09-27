// Public settings for the website. Only public values: the Supabase URL and publishable key are
// meant for browsers; Stripe and service keys stay in the Supabase function secrets.

// Where this site is published (must match the SITE_URL function secret and a Supabase redirect URL).
export const SITE_URL = "https://lokeshvlogs.github.io/instagram-fullscreen-viewer/";

// The extension's page on addons.mozilla.org (update once it's listed).
export const ADDON_URL = "https://addons.mozilla.org/firefox/addon/instagram-fullscreen-viewer/";

export const SUPABASE_URL = "https://ymojcvdzuffvnrapmhdv.supabase.co";
export const SUPABASE_KEY = "sb_publishable__CAMY7h3uOUIgNi56ybwTA_mLKgVgk8";

export const TRIAL_DAYS = 30;
export const MAX_DEVICES = 3;

// Must match the Stripe prices (and IGFV_PLANS in the extension's src/config.js).
export const PLANS = [
  { id: "1m", name: "Monthly", price: 2.99, months: 1, per: "month", note: "" },
  { id: "6m", name: "6 months", price: 10, months: 6, per: "6 months", note: "Save 44%" },
  { id: "1y", name: "1 year", price: 15, months: 12, per: "year", note: "Save 58%", best: true },
];

export const DISCLAIMER =
  "Disclaimer: This extension is an independent tool and is not affiliated with, authorized, maintained, " +
  "or endorsed by Meta Platforms, Inc. or Instagram. This software is intended strictly for personal, " +
  "private, and educational use. Downloaded content cannot be used for commercial purposes, redistributed, " +
  "or re-uploaded without the express written consent of the original copyright owner. The developer " +
  "assumes no liability for misuse, copyright infringement, or violations of third-party Terms of Service " +
  "committed by the user.";
