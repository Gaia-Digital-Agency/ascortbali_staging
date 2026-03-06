// This module defines the Creator Registration Page component.
"use client";

import { useState } from "react";
import Link from "next/link";
import { API_BASE, setTokens } from "../../../lib/api";
import { withBasePath } from "../../../lib/paths";

const NATIONALITIES = [
  "Afghan", "Albanian", "Algerian", "American", "Andorran", "Angolan", "Argentinian", "Armenian",
  "Australian", "Austrian", "Azerbaijani", "Bahraini", "Bangladeshi", "Belarusian", "Belgian",
  "Bolivian", "Bosnian", "Brazilian", "British", "Bulgarian", "Cambodian", "Cameroonian",
  "Canadian", "Chilean", "Chinese", "Colombian", "Congolese", "Croatian", "Cuban", "Czech",
  "Danish", "Dominican", "Dutch", "Ecuadorian", "Egyptian", "Emirati", "Estonian", "Ethiopian",
  "Filipino", "Finnish", "French", "Georgian", "German", "Ghanaian", "Greek", "Guatemalan",
  "Honduran", "Hong Konger", "Hungarian", "Indian", "Indonesian", "Iranian", "Iraqi", "Irish",
  "Israeli", "Italian", "Ivorian", "Jamaican", "Japanese", "Jordanian", "Kazakhstani", "Kenyan",
  "Korean", "Kuwaiti", "Kyrgyz", "Laotian", "Latvian", "Lebanese", "Libyan", "Lithuanian",
  "Luxembourgish", "Macanese", "Malaysian", "Maldivian", "Maltese", "Mexican", "Moldovan",
  "Mongolian", "Moroccan", "Mozambican", "Myanmarese", "Namibian", "Nepalese", "New Zealander",
  "Nicaraguan", "Nigerian", "Norwegian", "Omani", "Pakistani", "Palestinian", "Panamanian",
  "Paraguayan", "Peruvian", "Polish", "Portuguese", "Puerto Rican", "Qatari", "Romanian",
  "Russian", "Saudi", "Senegalese", "Serbian", "Singaporean", "Slovak", "Slovenian",
  "South African", "Spanish", "Sri Lankan", "Sudanese", "Swedish", "Swiss", "Syrian",
  "Taiwanese", "Tajik", "Thai", "Tunisian", "Turkish", "Turkmen", "Ugandan", "Ukrainian",
  "Uruguayan", "Uzbek", "Venezuelan", "Vietnamese", "Yemeni", "Zimbabwean",
];

const AGES = Array.from({ length: 53 }, (_, i) => 18 + i); // 18–70

export default function CreatorRegisterPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [modelName, setModelName] = useState("");
  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");
  const [nationality, setNationality] = useState("");
  const [city, setCity] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [telegramId, setTelegramId] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Terms confirmation state.
  const [policyConfirmed, setPolicyConfirmed] = useState(false);
  const [termsConfirmed, setTermsConfirmed] = useState(false);
  const [privacyConfirmed, setPrivacyConfirmed] = useState(false);
  const [noNudeConfirmed, setNoNudeConfirmed] = useState(false);
  const hasAllConfirmations = policyConfirmed && termsConfirmed && privacyConfirmed && noNudeConfirmed;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!hasAllConfirmations) {
      setError("Please confirm all agreements before registering.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/register/creator`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password,
          modelName: modelName.trim(),
          gender,
          age: parseInt(age, 10),
          nationality,
          city: city.trim(),
          phoneNumber: phoneNumber.trim(),
          telegramId: telegramId.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (json?.error === "username_taken") throw new Error("Username is already taken. Choose another.");
        throw new Error(json?.error ?? "Registration failed.");
      }
      setTokens({ accessToken: json.accessToken, refreshToken: json.refreshToken });
      window.location.href = withBasePath("/creator/logged");
    } catch (err: any) {
      setError(err.message ?? "Unable to register.");
    } finally {
      setLoading(false);
    }
  };

  const sel = "mt-2 w-full rounded-2xl border border-brand-line bg-brand-surface2/40 px-4 py-3 text-sm outline-none focus:border-brand-gold/60";
  const inp = "mt-2 w-full rounded-2xl border border-brand-line bg-brand-surface2/40 px-4 py-3 text-sm outline-none placeholder:text-brand-muted/60 focus:border-brand-gold/60";

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="text-center">
        <div className="text-xs tracking-luxe text-brand-muted">CREATOR</div>
        <h1 className="mt-2 font-display text-3xl">Create Creator Account</h1>
      </div>

      <div className="rounded-3xl border border-brand-line bg-brand-surface/55 p-7 shadow-luxe">
        <form onSubmit={onSubmit} className="space-y-4">

          {/* Account credentials */}
          <div>
            <label className="text-xs tracking-[0.22em] text-brand-muted">USERNAME</label>
            <input
              required
              className={inp}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="your_username"
              pattern="[a-zA-Z0-9_]+"
              title="Letters, numbers, underscores only"
            />
          </div>

          <div>
            <label className="text-xs tracking-[0.22em] text-brand-muted">PASSWORD</label>
            <div className="relative mt-2">
              <input
                required
                type={showPassword ? "text" : "password"}
                className="w-full rounded-2xl border border-brand-line bg-brand-surface2/40 px-4 py-3 pr-16 text-sm outline-none placeholder:text-brand-muted/60 focus:border-brand-gold/60"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-brand-muted hover:text-brand-text"
                onClick={() => setShowPassword((p) => !p)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs tracking-[0.22em] text-brand-muted">CONFIRM PASSWORD</label>
            <input
              required
              type={showPassword ? "text" : "password"}
              className={inp}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat password"
            />
          </div>

          <hr className="border-brand-line" />

          {/* Creator profile fields */}
          <div>
            <label className="text-xs tracking-[0.22em] text-brand-muted">DISPLAY NAME</label>
            <input
              required
              className={inp}
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              placeholder="Your display name"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs tracking-[0.22em] text-brand-muted">GENDER</label>
              <select
                required
                className={sel}
                value={gender}
                onChange={(e) => setGender(e.target.value)}
              >
                <option value="" disabled>Select...</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="transgender">Transgender</option>
                <option value="undisclosed">Undisclosed</option>
              </select>
            </div>

            <div>
              <label className="text-xs tracking-[0.22em] text-brand-muted">AGE</label>
              <select
                required
                className={sel}
                value={age}
                onChange={(e) => setAge(e.target.value)}
              >
                <option value="" disabled>Select...</option>
                {AGES.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs tracking-[0.22em] text-brand-muted">NATIONALITY</label>
              <select
                required
                className={sel}
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
              >
                <option value="" disabled>Select...</option>
                {NATIONALITIES.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs tracking-[0.22em] text-brand-muted">CITY</label>
              <input
                required
                className={inp}
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Bali"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs tracking-[0.22em] text-brand-muted">PHONE / WHATSAPP</label>
              <input
                required
                className={inp}
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+62..."
              />
            </div>

            <div>
              <label className="text-xs tracking-[0.22em] text-brand-muted">TELEGRAM ID <span className="normal-case text-brand-muted/60">(optional)</span></label>
              <input
                className={inp}
                value={telegramId}
                onChange={(e) => setTelegramId(e.target.value)}
                placeholder="@username"
              />
            </div>
          </div>

          <hr className="border-brand-line" />

          {/* Agreements */}
          <div className="space-y-3 text-sm">
            <div className="text-xs tracking-[0.18em] text-brand-muted">AGREEMENTS</div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={policyConfirmed}
                onChange={(e) => setPolicyConfirmed(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-brand-line"
              />
              <span className="text-brand-muted">I confirm my registration/profile details follow platform policy.</span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={termsConfirmed}
                onChange={(e) => setTermsConfirmed(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-brand-line"
              />
              <span className="text-brand-muted">I agree to the Terms of Use.</span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={privacyConfirmed}
                onChange={(e) => setPrivacyConfirmed(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-brand-line"
              />
              <span className="text-brand-muted">I agree to the Privacy Statement.</span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={noNudeConfirmed}
                onChange={(e) => setNoNudeConfirmed(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-brand-line"
              />
              <span className="text-brand-muted">I confirm I will not upload nude photographs.</span>
            </label>
          </div>

          {error ? <div className="text-xs text-red-400">{error}</div> : null}

          <button disabled={loading || !hasAllConfirmations} className="btn btn-primary btn-block py-3">
            {loading ? "CREATING ACCOUNT..." : "CREATE CREATOR ACCOUNT"}
          </button>

          <div className="text-center text-xs text-brand-muted">
            Already have an account?{" "}
            <Link href="/creator" className="text-brand-gold hover:underline">
              Sign In
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
