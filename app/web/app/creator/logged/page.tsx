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
  gender: "female" | "male" | "transgender";
  age: number;
  location: string;
  eyes: string;
  hair_color: string;
  hair_length: string;
  pubic_hair: string;
  bust_size: string;
  bust_type: string;
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
  if (file.startsWith("/")) return file;
  const parts = file.split("/");
  const filename = parts[parts.length - 1];
  return withBasePath(`/api/clean-image/${encodeURIComponent(filename)}`);
};

const defaultSlots = Array.from({ length: 7 }, (_, i) => i + 1);
const APP_BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";
const CREATOR_NAME_REGEX = /^[A-Za-z0-9]{1,50}$/;

export default function CreatorPanel() {
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [images, setImages] = useState<CreatorImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingImageSlot, setSavingImageSlot] = useState<number | null>(null);
  const [imageInputs, setImageInputs] = useState<Record<number, string>>({});
  const [pwCurrent, setPwCurrent] = useState("");
  const [pwNew, setPwNew] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<string | null>(null);

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
        const nextInputs: Record<number, string> = {};
        (imgs as CreatorImage[]).forEach((img) => {
          nextInputs[img.sequence_number] = img.image_file;
        });
        setImageInputs(nextInputs);
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
    if (!CREATOR_NAME_REGEX.test(creatorName)) {
      setError("Creator name must be one word (letters/numbers only), max 50 characters.");
      setMessage(null);
      return;
    }

    setSavingProfile(true);
    setError(null);
    setMessage(null);
    try {
      const payload = {
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
        pubicHair: profile.pubic_hair ?? "",
        bustSize: profile.bust_size ?? "",
        bustType: profile.bust_type ?? "",
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
      };
      await apiFetch("/me/creator-profile", { method: "PUT", body: JSON.stringify(payload) });
      setMessage("Creator profile updated.");
    } catch (err: any) {
      if (err?.message === "creator_name_taken") {
        setError("Creator name is already in use. Please choose another one.");
      } else if (err?.message === "invalid_creator_name") {
        setError("Creator name must be one word (letters/numbers only), max 50 characters.");
      } else {
        setError(err.message ?? "Profile save failed");
      }
    } finally {
      setSavingProfile(false);
    }
  };

  const saveImage = async (sequenceNumber: number) => {
    const value = imageInputs[sequenceNumber]?.trim();
    if (!value) {
      setError("Image URL/path is required.");
      return;
    }
    setSavingImageSlot(sequenceNumber);
    setError(null);
    setMessage(null);
    try {
      const created = await apiFetch("/me/creator-images", {
        method: "POST",
        body: JSON.stringify({ sequenceNumber, imageFile: value }),
      });
      setImages((prev) => {
        const without = prev.filter((img) => img.sequence_number !== sequenceNumber);
        return [...without, created].sort((a, b) => a.sequence_number - b.sequence_number);
      });
      setMessage(`Image slot ${sequenceNumber} saved.`);
    } catch (err: any) {
      setError(err.message ?? "Image save failed");
    } finally {
      setSavingImageSlot(null);
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
      setImageInputs((prev) => ({ ...prev, [sequenceNumber]: "" }));
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
      setImageInputs((prev) => ({ ...prev, [sequenceNumber]: data.url }));
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

  if (!profile) return <div className="text-sm text-brand-muted">Loading creator profile...</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs tracking-luxe text-brand-muted">CREATOR</div>
          <h1 className="mt-2 font-display text-3xl">Creator CRUD</h1>
          <p className="mt-2 text-sm text-brand-muted">
            Username: {profile.username} | Temp password: {profile.temp_password || "not set"}
          </p>
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

      <section className="rounded-3xl border border-brand-line bg-brand-surface/55 p-7">
        <div className="text-xs tracking-luxe text-brand-muted">PROFILE (ALIGNED TO page_data.json)</div>
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
          <Field label="TITLE">
            <input className="w-full rounded-2xl border border-brand-line bg-brand-surface2/40 px-4 py-3 text-sm outline-none focus:border-brand-gold/60" value={profile.title ?? ""} onChange={(e) => updateProfile("title", e.target.value)} />
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
          <Field label="PUBIC HAIR">
            <input className="w-full rounded-2xl border border-brand-line bg-brand-surface2/40 px-4 py-3 text-sm outline-none focus:border-brand-gold/60" value={profile.pubic_hair ?? ""} onChange={(e) => updateProfile("pubic_hair", e.target.value)} />
          </Field>
          <Field label="BUST SIZE">
            <input className="w-full rounded-2xl border border-brand-line bg-brand-surface2/40 px-4 py-3 text-sm outline-none focus:border-brand-gold/60" value={profile.bust_size ?? ""} onChange={(e) => updateProfile("bust_size", e.target.value)} />
          </Field>
          <Field label="BUST TYPE">
            <input className="w-full rounded-2xl border border-brand-line bg-brand-surface2/40 px-4 py-3 text-sm outline-none focus:border-brand-gold/60" value={profile.bust_type ?? ""} onChange={(e) => updateProfile("bust_type", e.target.value)} />
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
            <input
              type="password"
              className="w-full rounded-2xl border border-brand-line bg-brand-surface2/40 px-4 py-3 text-sm outline-none focus:border-brand-gold/60"
              value={pwCurrent}
              onChange={(e) => setPwCurrent(e.target.value)}
              placeholder="Current password (or temp password)"
            />
          </Field>
          <Field label="NEW PASSWORD">
            <input
              type="password"
              className="w-full rounded-2xl border border-brand-line bg-brand-surface2/40 px-4 py-3 text-sm outline-none focus:border-brand-gold/60"
              value={pwNew}
              onChange={(e) => setPwNew(e.target.value)}
              placeholder="New password"
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
        <div className="text-xs tracking-luxe text-brand-muted">IMAGES (7 SLOTS: 1 MAIN + 6 OTHERS)</div>
        <div className="mt-5 grid gap-5 md:grid-cols-3">
          {defaultSlots.map((slot) => {
            const existing = images.find((img) => img.sequence_number === slot);
            return (
              <ImageSlotEditor
                key={slot}
                slot={slot}
                imageUrl={toImageUrl(existing?.image_file || imageInputs[slot])}
                rawValue={imageInputs[slot] ?? existing?.image_file ?? ""}
                busy={savingImageSlot === slot}
                onValueChange={(value) => setImageInputs((prev) => ({ ...prev, [slot]: value }))}
                onSave={() => saveImage(slot)}
                onDelete={() => removeImage(slot)}
                onUpload={(file) => uploadImage(slot, file)}
              />
            );
          })}
        </div>
      </section>

      {error ? <div className="text-xs text-red-400">{error}</div> : null}
      {message ? <div className="text-xs text-emerald-400">{message}</div> : null}
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

function ImageSlotEditor({
  slot,
  imageUrl,
  rawValue,
  busy,
  onValueChange,
  onSave,
  onDelete,
  onUpload,
}: {
  slot: number;
  imageUrl: string | null;
  rawValue: string;
  busy: boolean;
  onValueChange: (value: string) => void;
  onSave: () => void;
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
      <input
        className="w-full rounded-xl border border-brand-line bg-brand-surface2/40 px-3 py-2 text-xs outline-none focus:border-brand-gold/60"
        value={rawValue}
        onChange={(e) => onValueChange(e.target.value)}
        placeholder="Image URL or /uploads path"
      />
      <div className="flex gap-2">
        <button onClick={onSave} disabled={busy} className="btn btn-primary px-3 py-2 text-xs">
          {busy ? "..." : "SAVE"}
        </button>
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
