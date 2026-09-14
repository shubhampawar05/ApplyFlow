"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import type { ResumeProfileContent } from "@/features/ai/resume-parsing.schema";

type ProfileState = {
  fullName: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  skills: string;
};

export function ResumeProfileReview({
  resumeId,
  initialProfile,
}: {
  resumeId: string;
  initialProfile: {
    fullName: string | null;
    headline: string | null;
    email: string | null;
    phone: string | null;
    location: string | null;
    content: ResumeProfileContent;
  };
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const [saved, setSaved] = useState(false);
  const [profile, setProfile] = useState<ProfileState>({
    fullName: initialProfile.fullName ?? "",
    headline: initialProfile.headline ?? "",
    email: initialProfile.email ?? "",
    phone: initialProfile.phone ?? "",
    location: initialProfile.location ?? "",
    summary: initialProfile.content.summary ?? "",
    skills: initialProfile.content.skills.join(", "),
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(undefined);
    setSaved(false);

    const skills = profile.skills
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean);

    try {
      const response = await fetch(`/api/resumes/${resumeId}/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: profile.fullName || null,
          headline: profile.headline || null,
          email: profile.email || null,
          phone: profile.phone || null,
          location: profile.location || null,
          content: {
            summary: profile.summary || null,
            skills,
            experience: initialProfile.content.experience,
            education: initialProfile.content.education,
          },
        }),
      });

      const payload = (await response.json()) as { error?: { message?: string } };
      if (!response.ok) {
        setError(payload.error?.message ?? "We could not save your profile changes.");
        return;
      }

      setSaved(true);
      router.refresh();
    } catch {
      setError("We could not save your profile changes.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="profile-review" onSubmit={handleSubmit}>
      <p className="section-label">Review profile</p>
      <p className="quiet-note">Correct anything the parser missed. Applications will only use facts you keep here.</p>
      <div className="profile-grid">
        <label>
          Full name
          <input value={profile.fullName} onChange={(event) => setProfile({ ...profile, fullName: event.target.value })} />
        </label>
        <label>
          Headline
          <input value={profile.headline} onChange={(event) => setProfile({ ...profile, headline: event.target.value })} />
        </label>
        <label>
          Email
          <input value={profile.email} onChange={(event) => setProfile({ ...profile, email: event.target.value })} />
        </label>
        <label>
          Phone
          <input value={profile.phone} onChange={(event) => setProfile({ ...profile, phone: event.target.value })} />
        </label>
        <label>
          Location
          <input value={profile.location} onChange={(event) => setProfile({ ...profile, location: event.target.value })} />
        </label>
      </div>
      <label>
        Summary
        <textarea rows={4} value={profile.summary} onChange={(event) => setProfile({ ...profile, summary: event.target.value })} />
      </label>
      <label>
        Skills
        <textarea
          rows={3}
          value={profile.skills}
          onChange={(event) => setProfile({ ...profile, skills: event.target.value })}
          placeholder="Comma-separated skills"
        />
      </label>
      {error ? <p className="upload-error" role="alert">{error}</p> : null}
      {saved ? <p className="quiet-note" role="status">Profile saved.</p> : null}
      <button className="button" disabled={pending} type="submit">
        {pending ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}
