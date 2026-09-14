"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AiProcessingBanner } from "@/components/ai-processing-banner";
import { Button } from "@/components/button";
import { ErrorRecoveryHint } from "@/components/error-recovery-hint";

type MatchDetails = {
  score: number;
  summary: string;
  strengths: string[];
  gaps: string[];
  matchedSkills: string[];
  missingSkills: string[];
};

export function ApplicationMatchPanel({
  applicationId,
  initialMatch,
  canMatch,
  blockReason,
}: {
  applicationId: string;
  initialMatch: MatchDetails | null;
  canMatch: boolean;
  blockReason?: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const [match, setMatch] = useState<MatchDetails | null>(initialMatch);

  async function handleMatch() {
    setPending(true);
    setError(undefined);

    try {
      const response = await fetch(`/api/applications/${applicationId}/match`, { method: "POST" });
      const payload = (await response.json()) as {
        data?: { match?: MatchDetails };
        error?: { message?: string };
      };

      if (!response.ok) {
        setError(payload.error?.message ?? "We could not analyze the resume match. Try again.");
        return;
      }

      if (payload.data?.match) {
        setMatch(payload.data.match);
      }

      router.refresh();
    } catch {
      setError("We could not analyze the resume match. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="settings-section" id="section-match">
      <p className="section-label">Resume match</p>

      {!canMatch ? (
        <div className="empty-card">
          <h2>Complete the prerequisites first.</h2>
          <p>{blockReason}</p>
          {blockReason?.includes("Settings") ? (
            <Link className="button secondary" href="/settings">
              Go to Settings
            </Link>
          ) : null}
        </div>
      ) : (
        <div className="resume-card">
          <p className="resume-card-title">
            {match ? (
              <>
                Match score: <strong>{match.score}/100</strong>
              </>
            ) : (
              <strong>Compare your resume against this job.</strong>
            )}
          </p>
          <p className="quiet-note">
            Strengths and gaps are grounded in your parsed resume profile and the reviewed job fields.
          </p>
          {pending ? <AiProcessingBanner message="Comparing your resume profile to this job…" /> : null}
          <Button loading={pending} onClick={handleMatch} type="button" variant="secondary">
            {match ? "Re-run match analysis" : "Run match analysis"}
          </Button>
          {error ? (
            <>
              <p className="upload-error" role="alert">
                {error}
              </p>
              <ErrorRecoveryHint href="/settings" linkLabel="Review your resume profile">
                Make sure the job details are saved and your resume profile is parsed in Settings.
              </ErrorRecoveryHint>
            </>
          ) : null}
        </div>
      )}

      {match ? (
        <div className="match-results">
          <p className="match-summary">{match.summary}</p>

          {match.strengths.length > 0 ? (
            <div className="match-list-block">
              <h3>Strengths</h3>
              <ul>
                {match.strengths.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {match.gaps.length > 0 ? (
            <div className="match-list-block">
              <h3>Gaps</h3>
              <ul>
                {match.gaps.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {match.matchedSkills.length > 0 ? (
            <div className="match-list-block">
              <h3>Matched skills</h3>
              <p className="skill-tags">
                {match.matchedSkills.map((skill) => (
                  <span className="skill-tag matched" key={skill}>{skill}</span>
                ))}
              </p>
            </div>
          ) : null}

          {match.missingSkills.length > 0 ? (
            <div className="match-list-block">
              <h3>Missing skills</h3>
              <p className="skill-tags">
                {match.missingSkills.map((skill) => (
                  <span className="skill-tag missing" key={skill}>{skill}</span>
                ))}
              </p>
            </div>
          ) : null}
        </div>
      ) : canMatch ? (
        <div className="empty-card">
          <h2>See how your resume fits this role.</h2>
          <p>
            ApplyFlow compares your structured resume profile to the job requirements and highlights aligned strengths
            plus gaps to address before drafting an email.
          </p>
        </div>
      ) : null}
    </section>
  );
}
