"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { apiFetch, clearTokens } from "../../../lib/api";
import { withBasePath } from "../../../lib/paths";

type CreatorProfile = {
  username: string;
  title: string;
  url: string;
  temp_password: string | null;
  last_seen: string;
  notes: string;
  model_name: string;
  is_active: boolean;
  gender: "female" | "male" | "transgender";
  age: number;
  location: string;
  eyes: string;
  hair_color: string;
  hair_length: string;
  travel: string;
  weight: string;
  height: string;
  ethnicity: string;
  nationality: string;
  languages: string;
  phone_number: string;
  cell_phone: string;
  country: string;
  city: string;
  orientation: "straight" | "bisexual" | "lesbian" | "gay" | "other";
  smoker: "yes" | "no";
  tattoo: "yes" | "no";
  piercing: "yes" | "no";
  services: string;
  meeting_with: "men" | "women" | "couples" | "all";
  available_for: "incall" | "outcall" | "both";
};

type CreatorImage = {
  image_id: string;
  image_file: string;
  sequence_number: number;
};

const toImageUrl = (file?: string | null) => {
  if (!file) return null;
  if (file.startsWith("http://") || file.startsWith("https://")) return file;
  if (file.startsWith("/")) {
    if (APP_BASE_PATH && file.startsWith(`${APP_BASE_PATH}/`)) return file;
    return withBasePath(file);
  }
  const parts = file.split("/");
  const filename = parts[parts.length - 1];
  return withBasePath(`/api/clean-image/${encodeURIComponent(filename)}`);
};

const defaultSlots = Array.from({ length: 20 }, (_, i) => i + 1);
const APP_BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";
const CREATOR_NAME_REGEX = /^[A-Za-z0-9]{1,50}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function CreatorPanel() {
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [images, setImages] = useState<CreatorImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingImageSlot, setSavingImageSlot] = useState<number | null>(null);
  const [pwCurrent, setPwCurrent] = useState("");
  const [pwNew, setPwNew] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const [showPwCurrent, setShowPwCurrent] = useState(false);
  const [showPwNew, setShowPwNew] = useState(false);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const [deactivateChecks, setDeactivateChecks] = useState<boolean[]>([false, false, false, false, false]);

  useEffect(() => {
    (async () => {
      try {
        const me = await apiFetch("/me");
        if (me.role !== "creator") {
          clearTokens();
          window.location.href = withBasePath("/creator");
          return;
        }
        const [p, imgs] = await Promise.all([apiFetch("/me/creator-profile"), apiFetch("/me/creator-images")]);
        setProfile(p);
        setImages(imgs);
      } catch {
        clearTokens();
        window.location.href = withBasePath("/creator");
      }
    })();
  }, []);

  const updateProfile = <K extends keyof CreatorProfile>(key: K, value: CreatorProfile[K]) =>
    setProfile((prev) => (prev ? { ...prev, [key]: value } : prev));

  const saveProfile = async () => {
    if (!profile) return;
    const creatorName = (profile.model_name ?? "").trim();
    const username = (profile.username ?? "").trim().toLowerCase();
    if (!CREATOR_NAME_REGEX.test(creatorName)) {
      setError("Creator name must be one word (letters/numbers only), max 50 characters.");
      setMessage(null);
      return;
    }
    if (!EMAIL_REGEX.test(username)) {
      setError("Username must be a valid email address.");
      setMessage(null);
      return;
    }

    setSavingProfile(true);
    setError(null);
    setMessage(null);
    try {
  const payload = {
        username,
        title: profile.title,
        url: profile.url,
        tempPassword: profile.temp_password ?? "",
        lastSeen: profile.last_seen ?? "",
        notes: profile.notes ?? "",
        modelName: creatorName,
    gender: profile.gender,
    age: Number(profile.age),
        location: profile.location ?? "",
    eyes: profile.eyes ?? "",
    hairColor: profile.hair_color ?? "",
    hairLength: profile.hair_length ?? "",
    travel: profile.travel ?? "",
        weight: profile.weight ?? "",
        height: profile.height ?? "",
        ethnicity: profile.ethnicity ?? "",
        nationality: profile.nationality,
        languages: profile.languages ?? "",
        phoneNumber: profile.phone_number ?? "",
        cellPhone: profile.cell_phone ?? "",
        country: profile.country,
        city: profile.city,
        orientation: profile.orientation,
        smoker: profile.smoker,
        tattoo: profile.tattoo,
        piercing: profile.piercing,
    services: profile.services,
    meetingWith: profile.meeting_with,
    availableFor: profile.available_for,
    isActive: profile.is_active,
  };
      await apiFetch("/me/creator-profile", { method: "PUT", body: JSON.stringify(payload) });
      setMessage("Creator profile updated.");
    } catch (err: any) {
      if (err?.message === "creator_name_taken") {
        setError("Creator name is already in use. Please choose another one.");
      } else if (err?.message === "invalid_creator_name") {
        setError("Creator name must be one word (letters/numbers only), max 50 characters.");
      } else if (err?.message === "username_taken") {
        setError("Username is already in use.");
      } else {
        setError(err.message ?? "Profile save failed");
      }
    } finally {
      setSavingProfile(false);
    }
  };

  const removeImage = async (sequenceNumber: number) => {
    const target = images.find((img) => img.sequence_number === sequenceNumber);
    if (!target) return;
    setSavingImageSlot(sequenceNumber);
    setError(null);
    setMessage(null);
    try {
      await apiFetch(`/me/creator-images/${target.image_id}`, { method: "DELETE" });
      setImages((prev) => prev.filter((img) => img.image_id !== target.image_id));
      setMessage(`Image slot ${sequenceNumber} removed.`);
    } catch (err: any) {
      setError(err.message ?? "Image delete failed");
    } finally {
      setSavingImageSlot(null);
    }
  };

  const uploadImage = async (sequenceNumber: number, file: File) => {
    setSavingImageSlot(sequenceNumber);
    setError(null);
    setMessage(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`${APP_BASE_PATH}/api/upload`, { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Upload failed");
      await apiFetch("/me/creator-images", {
        method: "POST",
        body: JSON.stringify({ sequenceNumber, imageFile: data.url }),
      });
      const refreshed = await apiFetch("/me/creator-images");
      setImages(refreshed);
      setMessage(`Uploaded image for slot ${sequenceNumber}.`);
    } catch (err: any) {
      setError(err.message ?? "Upload failed");
    } finally {
      setSavingImageSlot(null);
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

  const toggleActive = async (next: boolean) => {
    if (!profile) return;
    setError(null);
    setMessage(null);
    setSavingProfile(true);
    try {
      const payload = {
        username: (profile.username ?? "").trim().toLowerCase(),
        title: profile.title,
        url: profile.url,
        tempPassword: profile.temp_password ?? "",
        lastSeen: profile.last_seen ?? "",
        notes: profile.notes ?? "",
        modelName: profile.model_name ?? "",
        gender: profile.gender,
        age: Number(profile.age),
        location: profile.location ?? "",
        eyes: profile.eyes ?? "",
        hairColor: profile.hair_color ?? "",
        hairLength: profile.hair_length ?? "",
        travel: profile.travel ?? "",
        weight: profile.weight ?? "",
        height: profile.height ?? "",
        ethnicity: profile.ethnicity ?? "",
        nationality: profile.nationality,
        languages: profile.languages ?? "",
        phoneNumber: profile.phone_number ?? "",
        cellPhone: profile.cell_phone ?? "",
        country: profile.country,
        city: profile.city,
        orientation: profile.orientation,
        smoker: profile.smoker,
        tattoo: profile.tattoo,
        piercing: profile.piercing,
        services: profile.services,
        meetingWith: profile.meeting_with,
        availableFor: profile.available_for,
        isActive: next,
      };
      await apiFetch("/me/creator-profile", { method: "PUT", body: JSON.stringify(payload) });
      setProfile((prev) => (prev ? { ...prev, is_active: next } : prev));
      setMessage(next ? "Profile is now active." : "Profile is now inactive.");
      setShowDeactivateConfirm(false);
      setDeactivateChecks([false, false, false, false, false]);
    } catch (err: any) {
      setError(err.message ?? "Profile status update failed");
    } finally {
      setSavingProfile(false);
    }
  };

  if (!profile) return <div className="text-sm text-brand-muted">Loading creator profile...</div>;

  return (
    <div className="space-y-8">
      <div className="flex w-full flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="text-xs tracking-luxe text-brand-muted">CREATOR</div>
          <h1 className="mt-2 whitespace-nowrap font-display text-2xl md:text-3xl">Creator Profile Page</h1>
        </div>
        <div className="flex w-full flex-col gap-2 md:w-auto md:items-end">
          <div className="grid w-full grid-cols-3 gap-2 md:w-auto md:flex">
            <Link className="btn btn-outline px-2 py-2 text-[10px] tracking-[0.14em]" href={withBasePath("/")}>
              BACK HOME
            </Link>
            <button
              onClick={() => {
                if (profile.is_active) {
                  setShowDeactivateConfirm(true);
                } else {
                  void toggleActive(true);
                }
              }}
              className="btn btn-outline px-2 py-2 text-[10px] tracking-[0.14em]"
              disabled={savingProfile}
            >
              {profile.is_active ? "DEACTIVATE" : "ACTIVATE"}
            </button>
            <button onClick={logout} className="btn btn-outline px-2 py-2 text-[10px] tracking-[0.14em]">
              LOGOUT
            </button>
          </div>
          <p className="text-[11px] text-brand-muted md:text-right">
            Username: {profile.username} | Temp password: {profile.temp_password || "not set"}
          </p>
        </div>
      </div>

      <section className="rounded-3xl border border-brand-line bg-brand-surface/55 p-7">
        <div className="text-xs tracking-luxe text-brand-muted">PROFILE</div>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <Field label="NAME">
            <input
              className="w-full rounded-2xl border border-brand-line bg-brand-surface2/40 px-4 py-3 text-sm outline-none focus:border-brand-gold/60"
              value={profile.model_name ?? ""}
              onChange={(e) => updateProfile("model_name", e.target.value.replace(/[^A-Za-z0-9]/g, "").slice(0, 50))}
              maxLength={50}
              inputMode="text"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              placeholder="One word, letters/numbers only"
            />
          </Field>
          <Field label="USERNAME">
            <input
              type="email"
              className="w-full rounded-2xl border border-brand-line bg-brand-surface2/40 px-4 py-3 text-sm outline-none focus:border-brand-gold/60"
              value={profile.username ?? ""}
              onChange={(e) => updateProfile("username", e.target.value)}
              placeholder="username@email.com"
            />
          </Field>
          <Field label="URL">
            <input className="w-full rounded-2xl border border-brand-line bg-brand-surface2/40 px-4 py-3 text-sm outline-none focus:border-brand-gold/60" value={profile.url ?? ""} onChange={(e) => updateProfile("url", e.target.value)} />
          </Field>
          <Field label="AGE">
            <input type="number" className="w-full rounded-2xl border border-brand-line bg-brand-surface2/40 px-4 py-3 text-sm outline-none focus:border-brand-gold/60" value={profile.age ?? 18} onChange={(e) => updateProfile("age", Number(e.target.value))} />
          </Field>
          <Field label="NATIONALITY">
            <input className="w-full rounded-2xl border border-brand-line bg-brand-surface2/40 px-4 py-3 text-sm outline-none focus:border-brand-gold/60" value={profile.nationality ?? ""} onChange={(e) => updateProfile("nationality", e.target.value)} />
          </Field>
          <Field label="ETHNICITY">
            <input className="w-full rounded-2xl border border-brand-line bg-brand-surface2/40 px-4 py-3 text-sm outline-none focus:border-brand-gold/60" value={profile.ethnicity ?? ""} onChange={(e) => updateProfile("ethnicity", e.target.value)} />
          </Field>
          <Field label="COUNTRY">
            <input className="w-full rounded-2xl border border-brand-line bg-brand-surface2/40 px-4 py-3 text-sm outline-none focus:border-brand-gold/60" value={profile.country ?? ""} onChange={(e) => updateProfile("country", e.target.value)} />
          </Field>
          <Field label="CITY">
            <input className="w-full rounded-2xl border border-brand-line bg-brand-surface2/40 px-4 py-3 text-sm outline-none focus:border-brand-gold/60" value={profile.city ?? ""} onChange={(e) => updateProfile("city", e.target.value)} />
          </Field>
          <Field label="LOCATION">
            <input className="w-full rounded-2xl border border-brand-line bg-brand-surface2/40 px-4 py-3 text-sm outline-none focus:border-brand-gold/60" value={profile.location ?? ""} onChange={(e) => updateProfile("location", e.target.value)} />
          </Field>
          <Field label="PHONE NUMBER">
            <input className="w-full rounded-2xl border border-brand-line bg-brand-surface2/40 px-4 py-3 text-sm outline-none focus:border-brand-gold/60" value={profile.phone_number ?? ""} onChange={(e) => updateProfile("phone_number", e.target.value)} />
          </Field>
          <Field label="CELL PHONE">
            <input className="w-full rounded-2xl border border-brand-line bg-brand-surface2/40 px-4 py-3 text-sm outline-none focus:border-brand-gold/60" value={profile.cell_phone ?? ""} onChange={(e) => updateProfile("cell_phone", e.target.value)} />
          </Field>
          <Field label="TEMP PASSWORD">
            <input className="w-full rounded-2xl border border-brand-line bg-brand-surface2/40 px-4 py-3 text-sm outline-none focus:border-brand-gold/60" value={profile.temp_password ?? ""} onChange={(e) => updateProfile("temp_password", e.target.value)} />
          </Field>
          <Field label="LAST SEEN ONLINE">
            <input className="w-full rounded-2xl border border-brand-line bg-brand-surface2/40 px-4 py-3 text-sm outline-none focus:border-brand-gold/60" value={profile.last_seen ?? ""} onChange={(e) => updateProfile("last_seen", e.target.value)} />
          </Field>
          <Field label="LANGUAGES">
            <input className="w-full rounded-2xl border border-brand-line bg-brand-surface2/40 px-4 py-3 text-sm outline-none focus:border-brand-gold/60" value={profile.languages ?? ""} onChange={(e) => updateProfile("languages", e.target.value)} />
          </Field>
          <Field label="SERVICES">
            <input className="w-full rounded-2xl border border-brand-line bg-brand-surface2/40 px-4 py-3 text-sm outline-none focus:border-brand-gold/60" value={profile.services ?? ""} onChange={(e) => updateProfile("services", e.target.value)} />
          </Field>
          <Field label="EYES">
            <input className="w-full rounded-2xl border border-brand-line bg-brand-surface2/40 px-4 py-3 text-sm outline-none focus:border-brand-gold/60" value={profile.eyes ?? ""} onChange={(e) => updateProfile("eyes", e.target.value)} />
          </Field>
          <Field label="HAIR COLOR">
            <input className="w-full rounded-2xl border border-brand-line bg-brand-surface2/40 px-4 py-3 text-sm outline-none focus:border-brand-gold/60" value={profile.hair_color ?? ""} onChange={(e) => updateProfile("hair_color", e.target.value)} />
          </Field>
          <Field label="HAIR LENGTH">
            <input className="w-full rounded-2xl border border-brand-line bg-brand-surface2/40 px-4 py-3 text-sm outline-none focus:border-brand-gold/60" value={profile.hair_length ?? ""} onChange={(e) => updateProfile("hair_length", e.target.value)} />
          </Field>
          <Field label="HEIGHT">
            <input className="w-full rounded-2xl border border-brand-line bg-brand-surface2/40 px-4 py-3 text-sm outline-none focus:border-brand-gold/60" value={profile.height ?? ""} onChange={(e) => updateProfile("height", e.target.value)} />
          </Field>
          <Field label="WEIGHT">
            <input className="w-full rounded-2xl border border-brand-line bg-brand-surface2/40 px-4 py-3 text-sm outline-none focus:border-brand-gold/60" value={profile.weight ?? ""} onChange={(e) => updateProfile("weight", e.target.value)} />
          </Field>
          <Field label="TRAVEL">
            <input className="w-full rounded-2xl border border-brand-line bg-brand-surface2/40 px-4 py-3 text-sm outline-none focus:border-brand-gold/60" value={profile.travel ?? ""} onChange={(e) => updateProfile("travel", e.target.value)} />
          </Field>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <ChoiceGroup label="GENDER" value={profile.gender} options={["female", "male", "transgender"]} onChange={(v) => updateProfile("gender", v as CreatorProfile["gender"])} />
          <ChoiceGroup label="ORIENTATION" value={profile.orientation} options={["straight", "bisexual", "lesbian", "gay", "other"]} onChange={(v) => updateProfile("orientation", v as CreatorProfile["orientation"])} />
          <ChoiceGroup label="AVAILABLE FOR" value={profile.available_for} options={["incall", "outcall", "both"]} onChange={(v) => updateProfile("available_for", v as CreatorProfile["available_for"])} />
          <ChoiceGroup label="MEETING WITH" value={profile.meeting_with} options={["men", "women", "couples", "all"]} onChange={(v) => updateProfile("meeting_with", v as CreatorProfile["meeting_with"])} />
          <ChoiceGroup label="SMOKER" value={profile.smoker} options={["yes", "no"]} onChange={(v) => updateProfile("smoker", v as CreatorProfile["smoker"])} />
          <ChoiceGroup label="TATTOO" value={profile.tattoo} options={["yes", "no"]} onChange={(v) => updateProfile("tattoo", v as CreatorProfile["tattoo"])} />
          <ChoiceGroup label="PIERCING" value={profile.piercing} options={["yes", "no"]} onChange={(v) => updateProfile("piercing", v as CreatorProfile["piercing"])} />
        </div>

        <div className="mt-5">
          <Field label="NOTES">
            <textarea className="min-h-[120px] w-full rounded-2xl border border-brand-line bg-brand-surface2/40 px-4 py-3 text-sm outline-none focus:border-brand-gold/60" value={profile.notes ?? ""} onChange={(e) => updateProfile("notes", e.target.value)} />
          </Field>
        </div>

        <div className="mt-6">
          <button onClick={saveProfile} disabled={savingProfile} className="btn btn-primary py-3">
            {savingProfile ? "SAVING PROFILE..." : "SAVE PROFILE"}
          </button>
        </div>
      </section>

      <section className="rounded-3xl border border-brand-line bg-brand-surface/55 p-7">
        <div className="text-xs tracking-luxe text-brand-muted">CHANGE PASSWORD</div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Field label="CURRENT PASSWORD">
            <PasswordInput
              value={pwCurrent}
              onChange={setPwCurrent}
              placeholder="Current password (or temp password)"
              visible={showPwCurrent}
              onToggleVisibility={() => setShowPwCurrent((prev) => !prev)}
            />
          </Field>
          <Field label="NEW PASSWORD">
            <PasswordInput
              value={pwNew}
              onChange={setPwNew}
              placeholder="New password"
              visible={showPwNew}
              onToggleVisibility={() => setShowPwNew((prev) => !prev)}
            />
          </Field>
        </div>
        {pwMsg ? <div className="mt-4 text-xs text-emerald-400">{pwMsg}</div> : null}
        <div className="mt-6">
          <button onClick={changePassword} disabled={pwSaving || !pwNew.trim()} className="btn btn-primary py-3">
            {pwSaving ? "SAVING..." : "UPDATE PASSWORD"}
          </button>
        </div>
      </section>

      <section className="rounded-3xl border border-brand-line bg-brand-surface/55 p-7">
        <div className="text-xs tracking-luxe text-brand-muted">IMAGES (20 SLOTS: 1 MAIN + 19 OTHERS)</div>
        <div className="mt-5 grid gap-5 md:grid-cols-3">
          {defaultSlots.map((slot) => {
            const existing = images.find((img) => img.sequence_number === slot);
            return (
              <ImageSlotEditor
                key={slot}
                slot={slot}
                imageUrl={toImageUrl(existing?.image_file)}
                busy={savingImageSlot === slot}
                onDelete={() => removeImage(slot)}
                onUpload={(file) => uploadImage(slot, file)}
              />
            );
          })}
        </div>
      </section>

      {error ? <div className="text-xs text-red-400">{error}</div> : null}
      {message ? <div className="text-xs text-emerald-400">{message}</div> : null}

      {showDeactivateConfirm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4">
          <div className="w-full max-w-lg rounded-3xl border border-brand-line bg-brand-bg p-6">
            <h2 className="font-display text-xl text-brand-text">Confirm Deactivation</h2>
            <p className="mt-2 text-xs text-brand-muted">Check all confirmations before deactivating your profile.</p>
            <div className="mt-4 space-y-3 text-sm">
              {[
                "I understand my profile will be hidden from site visitors.",
                "I understand I can reactivate my profile later.",
                "I have saved any profile changes I need.",
                "I understand active chats may be affected.",
                "I confirm I want to proceed with deactivation now.",
              ].map((label, idx) => (
                <label key={label} className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={deactivateChecks[idx]}
                    onChange={(e) =>
                      setDeactivateChecks((prev) => prev.map((v, i) => (i === idx ? e.target.checked : v)))
                    }
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
            <div className="mt-5 flex gap-2">
              <button className="btn btn-outline px-4 py-2 text-xs" onClick={() => setShowDeactivateConfirm(false)}>
                CANCEL
              </button>
              <button
                className="btn btn-primary px-4 py-2 text-xs"
                disabled={!deactivateChecks.every(Boolean) || savingProfile}
                onClick={() => void toggleActive(false)}
              >
                PROCEED
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs tracking-[0.22em] text-brand-muted">{label}</div>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function ChoiceGroup({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <div className="text-xs tracking-[0.22em] text-brand-muted">{label}</div>
      <div className="mt-2 space-y-2">
        {options.map((option) => (
          <label key={option} className="flex items-center gap-2 text-sm">
            <input type="radio" checked={value === option} onChange={() => onChange(option)} />
            <span className="capitalize">{option}</span>
          </label>
        ))}
      </div>
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
        className="w-full rounded-2xl border border-brand-line bg-brand-surface2/40 px-4 py-3 pr-16 text-sm outline-none focus:border-brand-gold/60"
        type={visible ? "text" : "password"}
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

function ImageSlotEditor({
  slot,
  imageUrl,
  busy,
  onDelete,
  onUpload,
}: {
  slot: number;
  imageUrl: string | null;
  busy: boolean;
  onDelete: () => void;
  onUpload: (file: File) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-3 rounded-2xl border border-brand-line bg-brand-surface2/40 p-4">
      <div className="text-xs tracking-[0.22em] text-brand-muted">{slot === 1 ? "MAIN IMAGE" : `IMAGE ${slot}`}</div>
      <div className="aspect-[9/16] overflow-hidden rounded-xl border border-brand-line">
        {imageUrl ? (
          <img src={imageUrl} alt={`Slot ${slot}`} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-brand-muted">EMPTY</div>
        )}
      </div>
      <div className="flex gap-2">
        <button onClick={onDelete} disabled={busy} className="btn btn-outline px-3 py-2 text-xs">
          DELETE
        </button>
        <button onClick={() => fileRef.current?.click()} disabled={busy} className="btn btn-outline px-3 py-2 text-xs">
          UPLOAD
        </button>
      </div>
      <input
        ref={fileRef}
        type="file"
        className="hidden"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUpload(file);
        }}
      />
    </div>
  );
}
