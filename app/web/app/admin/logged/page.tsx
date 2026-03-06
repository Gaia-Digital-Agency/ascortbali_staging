"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { apiFetch, clearTokens } from "../../../lib/api";
import { withBasePath } from "../../../lib/paths";

type Me = { username: string; role: string };
type AdminStats = { creatorCount: number; userCount: number };
type UserAccount = { id: string; username: string; password: string; created_at: string; updated_at: string };
type CreatorAccount = { id: string; username: string; password: string | null; temp_password: string | null; last_seen: string | null; created_at: string; updated_at: string };
type AdSpace = {
  slot: "home-1" | "home-2" | "home-3" | "bottom";
  image: string | null;
  text: string | null;
  link_url: string | null;
};

const defaultAds: AdSpace[] = [
  {
    slot: "home-1",
    image: withBasePath("/api/uploads/baligirls/ads/unique.png"),
    text: null,
    link_url: "https://lightcyan-horse-210187.hostingersite.com/",
  },
  {
    slot: "home-2",
    image: withBasePath("/api/uploads/baligirls/ads/humapedia.png"),
    text: null,
    link_url: "https://www.humanspedia.com/",
  },
  { slot: "home-3", image: null, text: null, link_url: "https://www.baligirls.com/" },
  { slot: "bottom", image: null, text: "Your Ads Here", link_url: null },
];
const APP_BASE_PATH = (process.env.NEXT_PUBLIC_BASE_PATH || "").replace(/\/+$/g, "");

function normalizeAdImage(image: string | null) {
  const raw = (image ?? "").trim();
  if (!raw) return null;
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  if (raw.startsWith("/api/")) return withBasePath(raw);
  if (APP_BASE_PATH && raw.startsWith(`${APP_BASE_PATH}/`)) return raw;
  return raw;
}

function toStoredImage(image: string | null) {
  const raw = (image ?? "").trim();
  if (!raw) return null;
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  if (APP_BASE_PATH && raw.startsWith(`${APP_BASE_PATH}/`)) {
    const stripped = raw.slice(APP_BASE_PATH.length);
    return stripped.startsWith("/") ? stripped : `/${stripped}`;
  }
  return raw;
}

function normalizeAdSpace(ad: AdSpace): AdSpace {
  return { ...ad, image: normalizeAdImage(ad.image) };
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return iso;
  }
}

type EditUserState = { username: string; password: string };
type EditCreatorState = { username: string; password: string; tempPassword: string };

export default function AdminDashboard() {
  const [me, setMe] = useState<Me | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [ads, setAds] = useState<AdSpace[]>(defaultAds);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [creators, setCreators] = useState<CreatorAccount[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [savingSlot, setSavingSlot] = useState<string | null>(null);
  const [pwCurrent, setPwCurrent] = useState("admin123");
  const [pwNew, setPwNew] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const [showPwCurrent, setShowPwCurrent] = useState(false);
  const [showPwNew, setShowPwNew] = useState(false);

  // Inline edit state: maps id → edit form values.
  const [editingUser, setEditingUser] = useState<Record<string, EditUserState>>({});
  const [editingCreator, setEditingCreator] = useState<Record<string, EditCreatorState>>({});
  const [savingAccountId, setSavingAccountId] = useState<string | null>(null);
  const [accountMsg, setAccountMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const profile = await apiFetch("/me");
        if (profile.role !== "admin") {
          clearTokens();
          window.location.href = withBasePath("/admin");
          return;
        }
        setMe(profile);
        const [statsData, adsData, accountsData] = await Promise.all([
          apiFetch("/admin/stats"),
          apiFetch("/admin/ads"),
          apiFetch("/admin/accounts"),
        ]);
        setStats(statsData);
        if (Array.isArray(adsData) && adsData.length) setAds(adsData.map(normalizeAdSpace));
        if (accountsData?.users) setUsers(accountsData.users);
        if (accountsData?.creators) setCreators(accountsData.creators);
      } catch {
        clearTokens();
        window.location.href = withBasePath("/admin");
      }
    })();
  }, []);

  const updateAd = (slot: AdSpace["slot"], patch: Partial<AdSpace>) => {
    setAds((prev) => prev.map((ad) => (ad.slot === slot ? { ...ad, ...patch } : ad)));
  };

  const saveSlot = async (slot: AdSpace["slot"]) => {
    const ad = ads.find((item) => item.slot === slot);
    if (!ad) return;
    setSavingSlot(slot);
    setError(null);
    try {
      await apiFetch(`/admin/ads/${slot}`, {
        method: "PUT",
        body: JSON.stringify({
          image: slot === "bottom" ? null : toStoredImage(ad.image),
          text: slot === "bottom" ? ad.text : null,
          link_url: slot === "bottom" ? null : (ad.link_url?.trim() || null),
        }),
      });
    } catch (err: any) {
      setError(err.message ?? "Failed to save ad slot.");
    } finally {
      setSavingSlot(null);
    }
  };

  const clearSlot = async (slot: AdSpace["slot"]) => {
    setSavingSlot(slot);
    setError(null);
    try {
      await apiFetch(`/admin/ads/${slot}`, { method: "DELETE" });
      if (slot === "bottom") {
        updateAd("bottom", { text: "Your Ads Here" });
      } else {
        updateAd(slot, { image: null, link_url: null });
      }
    } catch (err: any) {
      setError(err.message ?? "Failed to clear ad slot.");
    } finally {
      setSavingSlot(null);
    }
  };

  const logout = () => {
    clearTokens();
    window.location.assign(withBasePath("/"));
  };

  const changePassword = async () => {
    setPwSaving(true);
    setPwMsg(null);
    setError(null);
    try {
      await apiFetch("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword: pwCurrent, newPassword: pwNew }),
      });
      setPwMsg("Password updated.");
      setPwNew("");
    } catch (err: any) {
      setError(err.message ?? "Password change failed");
    } finally {
      setPwSaving(false);
    }
  };

  // ── User CRUD helpers ────────────────────────────────────────────────────
  const startEditUser = (u: UserAccount) =>
    setEditingUser((prev) => ({ ...prev, [u.id]: { username: u.username, password: u.password } }));
  const cancelEditUser = (id: string) =>
    setEditingUser((prev) => { const next = { ...prev }; delete next[id]; return next; });
  const saveUser = async (id: string) => {
    const form = editingUser[id];
    if (!form) return;
    setSavingAccountId(id); setError(null); setAccountMsg(null);
    try {
      await apiFetch(`/admin/accounts/users/${id}`, {
        method: "PUT",
        body: JSON.stringify({ username: form.username, password: form.password }),
      });
      setUsers((prev) => prev.map((u) => u.id === id ? { ...u, username: form.username, password: form.password } : u));
      cancelEditUser(id);
      setAccountMsg("User updated.");
    } catch (err: any) { setError(err.message ?? "User update failed"); }
    finally { setSavingAccountId(null); }
  };
  const deleteUser = async (id: string) => {
    if (!confirm("Delete this user? This cannot be undone.")) return;
    setSavingAccountId(id); setError(null); setAccountMsg(null);
    try {
      await apiFetch(`/admin/accounts/users/${id}`, { method: "DELETE" });
      setUsers((prev) => prev.filter((u) => u.id !== id));
      setStats((prev) => prev ? { ...prev, userCount: prev.userCount - 1 } : prev);
      setAccountMsg("User deleted.");
    } catch (err: any) { setError(err.message ?? "User delete failed"); }
    finally { setSavingAccountId(null); }
  };

  // ── Creator CRUD helpers ──────────────────────────────────────────────────
  const startEditCreator = (c: CreatorAccount) =>
    setEditingCreator((prev) => ({ ...prev, [c.id]: { username: c.username, password: c.password ?? "", tempPassword: c.temp_password ?? "" } }));
  const cancelEditCreator = (id: string) =>
    setEditingCreator((prev) => { const next = { ...prev }; delete next[id]; return next; });
  const saveCreator = async (id: string) => {
    const form = editingCreator[id];
    if (!form) return;
    setSavingAccountId(id); setError(null); setAccountMsg(null);
    try {
      await apiFetch(`/admin/accounts/creators/${id}`, {
        method: "PUT",
        body: JSON.stringify({ username: form.username, password: form.password, tempPassword: form.tempPassword || null }),
      });
      setCreators((prev) => prev.map((c) => c.id === id ? { ...c, username: form.username, password: form.password, temp_password: form.tempPassword || null } : c));
      cancelEditCreator(id);
      setAccountMsg("Creator updated.");
    } catch (err: any) { setError(err.message ?? "Creator update failed"); }
    finally { setSavingAccountId(null); }
  };
  const deleteCreator = async (id: string) => {
    if (!confirm("Delete this creator? This cannot be undone.")) return;
    setSavingAccountId(id); setError(null); setAccountMsg(null);
    try {
      await apiFetch(`/admin/accounts/creators/${id}`, { method: "DELETE" });
      setCreators((prev) => prev.filter((c) => c.id !== id));
      setStats((prev) => prev ? { ...prev, creatorCount: prev.creatorCount - 1 } : prev);
      setAccountMsg("Creator deleted.");
    } catch (err: any) { setError(err.message ?? "Creator delete failed"); }
    finally { setSavingAccountId(null); }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs tracking-luxe text-brand-muted">ADMIN</div>
          <h1 className="mt-2 font-display text-3xl">Ads CRUD</h1>
          <p className="mt-2 text-sm text-brand-muted">{me ? `Signed in as ${me.username}` : "Loading..."}</p>
        </div>
        <div className="flex gap-3">
          <Link className="btn btn-outline" href="/">
            BACK HOME
          </Link>
          <button onClick={logout} className="btn btn-outline">
            LOGOUT
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-brand-line bg-brand-surface/55 p-6 shadow-luxe">
          <div className="text-xs tracking-[0.22em] text-brand-muted">REGISTERED CREATORS</div>
          <div className="mt-4 font-display text-3xl text-brand-text">{stats?.creatorCount ?? "—"}</div>
        </div>
        <div className="rounded-3xl border border-brand-line bg-brand-surface/55 p-6 shadow-luxe">
          <div className="text-xs tracking-[0.22em] text-brand-muted">REGISTERED USERS</div>
          <div className="mt-4 font-display text-3xl text-brand-text">{stats?.userCount ?? "—"}</div>
        </div>
      </div>

      <div className="rounded-3xl border border-brand-line bg-brand-surface/55 p-7 shadow-luxe">
        <div className="text-xs tracking-[0.22em] text-brand-muted">HOMEPAGE IMAGE ADS (1, 2, 3)</div>
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {(["home-1", "home-2", "home-3"] as const).map((slot) => {
            const ad = ads.find((item) => item.slot === slot);
            return (
              <ImageAdEditor
                key={slot}
                slot={slot}
                image={ad?.image ?? null}
                linkUrl={ad?.link_url ?? null}
                busy={savingSlot === slot}
                onChange={(image) => updateAd(slot, { image })}
                onChangeLinkUrl={(link_url) => updateAd(slot, { link_url })}
                onSave={() => saveSlot(slot)}
                onClear={() => clearSlot(slot)}
              />
            );
          })}
        </div>
      </div>

      <div className="rounded-3xl border border-brand-line bg-brand-surface/55 p-7 shadow-luxe">
        <div className="text-xs tracking-[0.22em] text-brand-muted">BOTTOM CARD TEXT</div>
        <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto_auto]">
          <input
            className="rounded-2xl border border-brand-line bg-brand-surface2/40 px-4 py-3 text-sm outline-none focus:border-brand-gold/60"
            value={ads.find((a) => a.slot === "bottom")?.text ?? "Your Ads Here"}
            onChange={(e) => updateAd("bottom", { text: e.target.value })}
          />
          <button onClick={() => saveSlot("bottom")} disabled={savingSlot === "bottom"} className="btn btn-primary py-3">
            {savingSlot === "bottom" ? "SAVING..." : "SAVE"}
          </button>
          <button onClick={() => clearSlot("bottom")} disabled={savingSlot === "bottom"} className="btn btn-outline py-3">
            RESET
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-brand-line bg-brand-surface/55 p-7 shadow-luxe">
        <div className="text-xs tracking-[0.22em] text-brand-muted">CHANGE PASSWORD</div>
        <div className="mt-4 grid gap-4 md:grid-cols-[1fr_1fr_auto]">
          <PasswordInput
            value={pwCurrent}
            onChange={setPwCurrent}
            placeholder="Current password"
            visible={showPwCurrent}
            onToggleVisibility={() => setShowPwCurrent((prev) => !prev)}
          />
          <PasswordInput
            value={pwNew}
            onChange={setPwNew}
            placeholder="New password"
            visible={showPwNew}
            onToggleVisibility={() => setShowPwNew((prev) => !prev)}
          />
          <button onClick={changePassword} disabled={pwSaving || !pwNew.trim()} className="btn btn-primary py-3">
            {pwSaving ? "SAVING..." : "UPDATE"}
          </button>
        </div>
        {pwMsg ? <div className="mt-4 text-xs text-emerald-400">{pwMsg}</div> : null}
      </div>

      {/* Users CRUD */}
      <div className="rounded-3xl border border-brand-line bg-brand-surface/55 p-7 shadow-luxe">
        <div className="text-xs tracking-[0.22em] text-brand-muted">REGISTERED USERS ({users.length})</div>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-line text-left text-xs tracking-[0.18em] text-brand-muted">
                <th className="pb-3 pr-4 font-normal">USERNAME</th>
                <th className="pb-3 pr-4 font-normal">PASSWORD</th>
                <th className="pb-3 pr-4 font-normal">REGISTERED</th>
                <th className="pb-3 font-normal">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr><td colSpan={4} className="py-4 text-xs text-brand-muted">No users yet.</td></tr>
              ) : users.map((u) => {
                const editing = editingUser[u.id];
                const busy = savingAccountId === u.id;
                return editing ? (
                  <tr key={u.id} className="border-b border-brand-line/40 bg-brand-surface2/20">
                    <td className="py-2 pr-4">
                      <input
                        className="w-full rounded-xl border border-brand-line bg-brand-surface2/40 px-3 py-1.5 font-mono text-xs outline-none focus:border-brand-gold/60"
                        value={editing.username}
                        onChange={(e) => setEditingUser((p) => ({ ...p, [u.id]: { ...p[u.id], username: e.target.value } }))}
                      />
                    </td>
                    <td className="py-2 pr-4">
                      <input
                        className="w-full rounded-xl border border-brand-line bg-brand-surface2/40 px-3 py-1.5 font-mono text-xs outline-none focus:border-brand-gold/60"
                        value={editing.password}
                        onChange={(e) => setEditingUser((p) => ({ ...p, [u.id]: { ...p[u.id], password: e.target.value } }))}
                        placeholder="New password"
                      />
                    </td>
                    <td className="py-2 pr-4 text-xs text-brand-muted">{fmtDate(u.created_at)}</td>
                    <td className="py-2">
                      <div className="flex gap-2">
                        <button onClick={() => saveUser(u.id)} disabled={busy} className="btn btn-primary px-3 py-1.5 text-xs">{busy ? "..." : "SAVE"}</button>
                        <button onClick={() => cancelEditUser(u.id)} disabled={busy} className="btn btn-outline px-3 py-1.5 text-xs">CANCEL</button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={u.id} className="border-b border-brand-line/40 last:border-0">
                    <td className="py-3 pr-4 font-mono text-xs">{u.username}</td>
                    <td className="py-3 pr-4 font-mono text-xs">{u.password || "—"}</td>
                    <td className="py-3 pr-4 text-xs text-brand-muted">{fmtDate(u.created_at)}</td>
                    <td className="py-3">
                      <div className="flex gap-2">
                        <button onClick={() => startEditUser(u)} className="btn btn-outline px-3 py-1.5 text-xs">EDIT</button>
                        <button onClick={() => deleteUser(u.id)} disabled={savingAccountId === u.id} className="px-3 py-1.5 text-xs text-red-400 hover:text-red-300">DELETE</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Creators CRUD */}
      <div className="rounded-3xl border border-brand-line bg-brand-surface/55 p-7 shadow-luxe">
        <div className="text-xs tracking-[0.22em] text-brand-muted">REGISTERED CREATORS ({creators.length})</div>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-line text-left text-xs tracking-[0.18em] text-brand-muted">
                <th className="pb-3 pr-4 font-normal">USERNAME</th>
                <th className="pb-3 pr-4 font-normal">PASSWORD</th>
                <th className="pb-3 pr-4 font-normal">TEMP PW</th>
                <th className="pb-3 pr-4 font-normal">LAST SEEN</th>
                <th className="pb-3 pr-4 font-normal">REGISTERED</th>
                <th className="pb-3 font-normal">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {creators.length === 0 ? (
                <tr><td colSpan={6} className="py-4 text-xs text-brand-muted">No creators yet.</td></tr>
              ) : creators.map((c) => {
                const editing = editingCreator[c.id];
                const busy = savingAccountId === c.id;
                return editing ? (
                  <tr key={c.id} className="border-b border-brand-line/40 bg-brand-surface2/20">
                    <td className="py-2 pr-4">
                      <input
                        className="w-full rounded-xl border border-brand-line bg-brand-surface2/40 px-3 py-1.5 font-mono text-xs outline-none focus:border-brand-gold/60"
                        value={editing.username}
                        onChange={(e) => setEditingCreator((p) => ({ ...p, [c.id]: { ...p[c.id], username: e.target.value } }))}
                      />
                    </td>
                    <td className="py-2 pr-4">
                      <input
                        className="w-full rounded-xl border border-brand-line bg-brand-surface2/40 px-3 py-1.5 font-mono text-xs outline-none focus:border-brand-gold/60"
                        value={editing.password}
                        onChange={(e) => setEditingCreator((p) => ({ ...p, [c.id]: { ...p[c.id], password: e.target.value } }))}
                        placeholder="New password"
                      />
                    </td>
                    <td className="py-2 pr-4">
                      <input
                        className="w-full rounded-xl border border-brand-line bg-brand-surface2/40 px-3 py-1.5 font-mono text-xs outline-none focus:border-brand-gold/60"
                        value={editing.tempPassword}
                        onChange={(e) => setEditingCreator((p) => ({ ...p, [c.id]: { ...p[c.id], tempPassword: e.target.value } }))}
                        placeholder="Temp password"
                      />
                    </td>
                    <td className="py-2 pr-4 text-xs text-brand-muted">{c.last_seen || "—"}</td>
                    <td className="py-2 pr-4 text-xs text-brand-muted">{fmtDate(c.created_at)}</td>
                    <td className="py-2">
                      <div className="flex gap-2">
                        <button onClick={() => saveCreator(c.id)} disabled={busy} className="btn btn-primary px-3 py-1.5 text-xs">{busy ? "..." : "SAVE"}</button>
                        <button onClick={() => cancelEditCreator(c.id)} disabled={busy} className="btn btn-outline px-3 py-1.5 text-xs">CANCEL</button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={c.id} className="border-b border-brand-line/40 last:border-0">
                    <td className="py-3 pr-4 font-mono text-xs">{c.username || "—"}</td>
                    <td className="py-3 pr-4 font-mono text-xs">{c.password || "—"}</td>
                    <td className="py-3 pr-4 font-mono text-xs">{c.temp_password || "—"}</td>
                    <td className="py-3 pr-4 text-xs text-brand-muted">{c.last_seen || "—"}</td>
                    <td className="py-3 pr-4 text-xs text-brand-muted">{fmtDate(c.created_at)}</td>
                    <td className="py-3">
                      <div className="flex gap-2">
                        <button onClick={() => startEditCreator(c)} className="btn btn-outline px-3 py-1.5 text-xs">EDIT</button>
                        <button onClick={() => deleteCreator(c.id)} disabled={savingAccountId === c.id} className="px-3 py-1.5 text-xs text-red-400 hover:text-red-300">DELETE</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {accountMsg ? <div className="text-xs text-emerald-400">{accountMsg}</div> : null}
      {error ? <div className="text-xs text-red-400">{error}</div> : null}
    </div>
  );
}

function PasswordInput({
  value,
  onChange,
  placeholder,
  visible,
  onToggleVisibility,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  visible: boolean;
  onToggleVisibility: () => void;
}) {
  return (
    <div className="relative">
      <input
        type={visible ? "text" : "password"}
        className="w-full rounded-2xl border border-brand-line bg-brand-surface2/40 px-4 py-3 pr-16 text-sm outline-none focus:border-brand-gold/60"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      <button
        type="button"
        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-brand-muted hover:text-brand-text"
        onClick={onToggleVisibility}
      >
        {visible ? "Hide" : "Show"}
      </button>
    </div>
  );
}

function ImageAdEditor({
  slot,
  image,
  busy,
  linkUrl,
  onChange,
  onChangeLinkUrl,
  onSave,
  onClear,
}: {
  slot: "home-1" | "home-2" | "home-3";
  image: string | null;
  busy: boolean;
  linkUrl: string | null;
  onChange: (value: string) => void;
  onChangeLinkUrl: (value: string) => void;
  onSave: () => void;
  onClear: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    const form = new FormData();
    form.append("file", file);
    form.append("folder", "ads");
    const res = await fetch(`${APP_BASE_PATH}/api/upload`, { method: "POST", body: form });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error ?? "Upload failed");
    onChange(data.url);
  };

  return (
    <div className="space-y-3 rounded-2xl border border-brand-line bg-brand-surface2/40 p-4">
      <div className="text-xs tracking-[0.22em] text-brand-muted uppercase">{slot}</div>
      <div className="aspect-[9/16] overflow-hidden rounded-xl border border-brand-line">
        {image ? (
          <img src={image} alt={slot} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs tracking-[0.22em] text-brand-muted">
            EMPTY
          </div>
        )}
      </div>
      <input
        className="w-full rounded-xl border border-brand-line bg-brand-surface2/40 px-3 py-2 text-xs outline-none focus:border-brand-gold/60"
        value={image ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Image URL or /uploads path"
      />
      <input
        className="w-full rounded-xl border border-brand-line bg-brand-surface2/40 px-3 py-2 text-xs outline-none focus:border-brand-gold/60"
        value={linkUrl ?? ""}
        onChange={(e) => onChangeLinkUrl(e.target.value)}
        placeholder="Click URL (https://...)"
      />
      <div className="flex gap-2">
        <button onClick={onSave} disabled={busy} className="btn btn-primary px-3 py-2 text-xs">
          {busy ? "..." : "SAVE"}
        </button>
        <button onClick={onClear} disabled={busy} className="btn btn-outline px-3 py-2 text-xs">
          CLEAR
        </button>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="btn btn-outline px-3 py-2 text-xs"
        >
          UPLOAD
        </button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          try {
            await upload(file);
          } catch {
            // silent; parent save handles persistence
          }
        }}
      />
    </div>
  );
}
