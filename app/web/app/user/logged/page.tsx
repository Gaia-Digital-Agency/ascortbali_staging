// This module defines the User Dashboard component for managing user profiles.
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch, clearTokens } from "../../../lib/api";
import { withBasePath } from "../../../lib/paths";

// Type definition for a user profile.
type UserProfile = {
  fullName: string;
  gender: "female" | "male" | "transgender";
  ageGroup: "18-24" | "25-34" | "35-44" | "45+";
  nationality: string;
  city: string;
  preferredContact: "whatsapp" | "telegram" | "wechat";
  relationshipStatus: "single" | "married" | "other";
};

// Default user profile values.
const defaultProfile: UserProfile = {
  fullName: "",
  gender: "female",
  ageGroup: "25-34",
  nationality: "",
  city: "",
  preferredContact: "telegram",
  relationshipStatus: "single",
};

// UserDashboard functional component.
export default function UserDashboard() {
  // State variables for user authentication info, profile data, saving status, and messages.
  const [me, setMe] = useState<{ username: string; role: string } | null>(null);
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Effect hook to fetch user data and profile on component mount.
  useEffect(() => {
    (async () => {
      try {
        const m = await apiFetch("/me");
        if (m.role !== "user") {
          clearTokens();
          window.location.href = withBasePath("/user");
          return;
        }
        setMe(m);
        const p = await apiFetch("/me/user-profile");
        setProfile(p);
      } catch {
        window.location.href = withBasePath("/user");
      }
    })();
  }, []);

  // Function to update a specific profile field.
  const update = <K extends keyof UserProfile>(key: K, value: UserProfile[K]) =>
    setProfile((prev) => ({ ...prev, [key]: value }));

  // Function to save the user profile to the API.
  const save = async () => {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      if (!profile.fullName.trim() || !profile.nationality.trim() || !profile.city.trim()) {
        throw new Error("All fields are compulsory.");
      }
      await apiFetch("/me/user-profile", { method: "PUT", body: JSON.stringify(profile) });
      setMessage("Profile updated.");
    } catch (err: any) {
      setError(err.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  };

  // Function to log out the user.
  const logout = () => {
    clearTokens();
    window.location.assign(withBasePath("/"));
  };

  return (
    <div className="space-y-8">
      {/* Header section with title and navigation buttons. */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-xs tracking-luxe text-brand-muted">USER</div>
          <h1 className="mt-2 font-display text-3xl">Profile CRUD</h1>
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

      {/* User profile management section. */}
      <section className="rounded-3xl border border-brand-line bg-brand-surface/55 p-7">
        <div className="text-xs tracking-luxe text-brand-muted">ALL FIELDS REQUIRED</div>
        {/* Input fields for various profile details. */}
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Field label="FULL NAME">
            <input
              className="w-full rounded-2xl border border-brand-line bg-brand-surface2/40 px-4 py-3 text-sm outline-none focus:border-brand-gold/60"
              value={profile.fullName}
              onChange={(e) => update("fullName", e.target.value)}
            />
          </Field>

          <Field label="NATIONALITY">
            <input
              className="w-full rounded-2xl border border-brand-line bg-brand-surface2/40 px-4 py-3 text-sm outline-none focus:border-brand-gold/60"
              value={profile.nationality}
              onChange={(e) => update("nationality", e.target.value)}
            />
          </Field>

          <Field label="CITY">
            <input
              className="w-full rounded-2xl border border-brand-line bg-brand-surface2/40 px-4 py-3 text-sm outline-none focus:border-brand-gold/60"
              value={profile.city}
              onChange={(e) => update("city", e.target.value)}
            />
          </Field>

          <Field label="AGE GROUP">
            <select
              className="w-full rounded-2xl border border-brand-line bg-brand-surface2/40 px-4 py-3 text-sm outline-none focus:border-brand-gold/60"
              value={profile.ageGroup}
              onChange={(e) => update("ageGroup", e.target.value as UserProfile["ageGroup"])}
            >
              <option value="18-24">18-24</option>
              <option value="25-34">25-34</option>
              <option value="35-44">35-44</option>
              <option value="45+">45+</option>
            </select>
          </Field>
        </div>

        {/* Radio button groups for gender, preferred contact, and relationship status. */}
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <RadioGroup
            label="GENDER"
            value={profile.gender}
            options={["female", "male", "transgender"]}
            onChange={(value) => update("gender", value as UserProfile["gender"])}
          />
          <RadioGroup
            label="PREFERRED CONTACT"
            value={profile.preferredContact}
            options={["whatsapp", "telegram", "wechat"]}
            onChange={(value) => update("preferredContact", value as UserProfile["preferredContact"])}
          />
          <RadioGroup
            label="RELATIONSHIP STATUS"
            value={profile.relationshipStatus}
            options={["single", "married", "other"]}
            onChange={(value) => update("relationshipStatus", value as UserProfile["relationshipStatus"])}
          />
        </div>

        {/* Error and message display. */}
        {error ? <div className="mt-4 text-xs text-red-400">{error}</div> : null}
        {message ? <div className="mt-4 text-xs text-emerald-400">{message}</div> : null}

        {/* Save profile button. */}
        <div className="mt-6">
          <button onClick={save} disabled={saving} className="btn btn-primary py-3">
            {saving ? "SAVING..." : "SAVE PROFILE"}
          </button>
        </div>
      </section>
    </div>
  );
}

// Helper component for rendering form fields with labels.
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs tracking-[0.22em] text-brand-muted">{label}</div>
      <div className="mt-2">{children}</div>
    </div>
  );
}

// Helper component for rendering radio button groups.
function RadioGroup({
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
      <div className="mt-3 space-y-2">
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
