"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@/components/button";
import { useToast } from "@/components/toast-provider";

type JobReviewState = {
  company: string;
  title: string;
  location: string;
  employmentType: string;
  experience: string;
  applicationEmail: string;
  applicationUrl: string;
  salary: string;
  source: string;
  skills: string;
  description: string;
};

export function JobReviewForm({
  jobId,
  initialJob,
}: {
  jobId: string;
  initialJob: {
    company: string | null;
    title: string | null;
    location: string | null;
    employmentType: string | null;
    experience: string | null;
    applicationEmail: string | null;
    applicationUrl: string | null;
    salary: string | null;
    source: string | null;
    skills: string[];
    description: string | null;
  };
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const [job, setJob] = useState<JobReviewState>({
    company: initialJob.company ?? "",
    title: initialJob.title ?? "",
    location: initialJob.location ?? "",
    employmentType: initialJob.employmentType ?? "",
    experience: initialJob.experience ?? "",
    applicationEmail: initialJob.applicationEmail ?? "",
    applicationUrl: initialJob.applicationUrl ?? "",
    salary: initialJob.salary ?? "",
    source: initialJob.source ?? "",
    skills: initialJob.skills.join(", "),
    description: initialJob.description ?? "",
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(undefined);

    const skills = job.skills
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean);

    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: job.company || null,
          title: job.title || null,
          location: job.location || null,
          employmentType: job.employmentType || null,
          experience: job.experience || null,
          applicationEmail: job.applicationEmail || null,
          applicationUrl: job.applicationUrl || null,
          salary: job.salary || null,
          source: job.source || null,
          skills,
          description: job.description || null,
        }),
      });

      const payload = (await response.json()) as { error?: { message?: string } };
      if (!response.ok) {
        setError(payload.error?.message ?? "We could not save your job changes.");
        return;
      }

      showToast("Job details saved.");
      router.refresh();
    } catch {
      setError("We could not save your job changes.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="profile-review" onSubmit={handleSubmit}>
      <p className="section-label">Review job details</p>
      <p className="quiet-note">Correct anything the extractor missed. Missing information can stay blank.</p>
      <div className="profile-grid">
        <label>
          Company
          <input value={job.company} onChange={(event) => setJob({ ...job, company: event.target.value })} />
        </label>
        <label>
          Title
          <input value={job.title} onChange={(event) => setJob({ ...job, title: event.target.value })} />
        </label>
        <label>
          Location
          <input value={job.location} onChange={(event) => setJob({ ...job, location: event.target.value })} />
        </label>
        <label>
          Employment type
          <input
            value={job.employmentType}
            onChange={(event) => setJob({ ...job, employmentType: event.target.value })}
          />
        </label>
        <label>
          Experience
          <input value={job.experience} onChange={(event) => setJob({ ...job, experience: event.target.value })} />
        </label>
        <label>
          Application email
          <input
            value={job.applicationEmail}
            onChange={(event) => setJob({ ...job, applicationEmail: event.target.value })}
          />
        </label>
        <label>
          Application URL
          <input
            value={job.applicationUrl}
            onChange={(event) => setJob({ ...job, applicationUrl: event.target.value })}
          />
        </label>
        <label>
          Salary
          <input value={job.salary} onChange={(event) => setJob({ ...job, salary: event.target.value })} />
        </label>
        <label>
          Source
          <input value={job.source} onChange={(event) => setJob({ ...job, source: event.target.value })} />
        </label>
      </div>
      <label>
        Skills
        <textarea
          rows={3}
          value={job.skills}
          onChange={(event) => setJob({ ...job, skills: event.target.value })}
          placeholder="Comma-separated skills"
        />
      </label>
      <label>
        Description
        <textarea rows={5} value={job.description} onChange={(event) => setJob({ ...job, description: event.target.value })} />
      </label>
      {error ? <p className="upload-error" role="alert">{error}</p> : null}
      <Button loading={pending} type="submit">
        Save job details
      </Button>
    </form>
  );
}
