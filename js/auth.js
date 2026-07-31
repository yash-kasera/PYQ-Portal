/* =========================================================
   Authentication
   - Roll number 0201AI2510XX, XX from 01 to 78.
   - Supabase Auth when configured in config.js; otherwise a
     localStorage account store so the portal works offline.
   ========================================================= */
(function () {
  "use strict";

  var PREFIX = "0201AI2510";
  var MIN_ROLL = 1, MAX_ROLL = 78;
  var LS_ACCOUNTS = "pyq.accounts";
  var LS_SESSION = "pyq.session";

  var cfg = window.PORTAL_CONFIG || {};
  var useSupabase = !!(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY && window.supabase);
  var sb = useSupabase
    ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY)
    : null;

  /* ---------- helpers ---------- */

  function rollToEmail(roll) {
    return roll.toLowerCase() + "@pyqportal.local";
  }

  function readAccounts() {
    try { return JSON.parse(localStorage.getItem(LS_ACCOUNTS) || "{}"); }
    catch (e) { return {}; }
  }

  function writeAccounts(obj) {
    localStorage.setItem(LS_ACCOUNTS, JSON.stringify(obj));
  }

  // SHA-256 with a per-account random salt. Adequate for a personal
  // study portal held entirely on the student's own device.
  function hashPassword(password, salt) {
    var data = new TextEncoder().encode(salt + "::" + password);
    return crypto.subtle.digest("SHA-256", data).then(function (buf) {
      return Array.prototype.map
        .call(new Uint8Array(buf), function (b) { return b.toString(16).padStart(2, "0"); })
        .join("");
    });
  }

  function randomSalt() {
    var a = new Uint8Array(16);
    crypto.getRandomValues(a);
    return Array.prototype.map.call(a, function (b) { return b.toString(16).padStart(2, "0"); }).join("");
  }

  /* ---------- public API ---------- */

  var Auth = {
    backend: useSupabase ? "supabase" : "local",
    client: sb,
    currentRoll: null,

    normalizeRoll: function (raw) {
      var digits = String(raw || "").replace(/\D/g, "");
      if (digits.length > 2) digits = digits.slice(-2); // tolerate a pasted full roll no.
      var n = parseInt(digits, 10);
      if (!digits.length || isNaN(n) || n < MIN_ROLL || n > MAX_ROLL) return null;
      return PREFIX + String(n).padStart(2, "0");
    },

    // Resolves true when this roll number already has a password.
    isRegistered: function (roll) {
      if (useSupabase) {
        return sb
          .from("profiles")
          .select("roll")
          .eq("roll", roll)
          .maybeSingle()
          .then(function (res) { return !!(res && res.data); })
          .catch(function () { return !!readAccounts()[roll]; });
      }
      return Promise.resolve(!!readAccounts()[roll]);
    },

    signUp: function (roll, password) {
      if (useSupabase) {
        return sb.auth
          .signUp({ email: rollToEmail(roll), password: password })
          .then(function (res) {
            if (res.error) throw new Error(res.error.message);
            // ignoreDuplicates → "ON CONFLICT DO NOTHING", which needs no
            // UPDATE policy on profiles. A plain upsert would.
            return sb.from("profiles")
              .upsert({ roll: roll }, { onConflict: "roll", ignoreDuplicates: true })
              .then(function () {
                Auth.currentRoll = roll;
                localStorage.setItem(LS_SESSION, roll);
                return roll;
              });
          });
      }
      var accounts = readAccounts();
      if (accounts[roll]) return Promise.reject(new Error("This roll number already has a password."));
      var salt = randomSalt();
      return hashPassword(password, salt).then(function (hash) {
        accounts[roll] = { salt: salt, hash: hash, created: Date.now() };
        writeAccounts(accounts);
        Auth.currentRoll = roll;
        localStorage.setItem(LS_SESSION, roll);
        return roll;
      });
    },

    signIn: function (roll, password) {
      if (useSupabase) {
        return sb.auth
          .signInWithPassword({ email: rollToEmail(roll), password: password })
          .then(function (res) {
            if (res.error) throw new Error("Incorrect password.");
            Auth.currentRoll = roll;
            localStorage.setItem(LS_SESSION, roll);
            return roll;
          });
      }
      var account = readAccounts()[roll];
      if (!account) return Promise.reject(new Error("No account found for this roll number."));
      return hashPassword(password, account.salt).then(function (hash) {
        if (hash !== account.hash) throw new Error("Incorrect password.");
        Auth.currentRoll = roll;
        localStorage.setItem(LS_SESSION, roll);
        return roll;
      });
    },

    // Restore a session on page load.
    restore: function () {
      var roll = localStorage.getItem(LS_SESSION);
      if (!roll) return Promise.resolve(null);
      if (useSupabase) {
        return sb.auth.getSession().then(function (res) {
          if (res && res.data && res.data.session) { Auth.currentRoll = roll; return roll; }
          localStorage.removeItem(LS_SESSION);
          return null;
        }).catch(function () { Auth.currentRoll = roll; return roll; });
      }
      Auth.currentRoll = roll;
      return Promise.resolve(roll);
    },

    signOut: function () {
      localStorage.removeItem(LS_SESSION);
      Auth.currentRoll = null;
      if (useSupabase) return sb.auth.signOut().catch(function () {});
      return Promise.resolve();
    }
  };

  window.Auth = Auth;
})();
