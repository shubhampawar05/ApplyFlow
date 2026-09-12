import type { JobDraft } from "./job.schemas";

export type NormalizedJobIdentity = {
  company: string | null;
  title: string | null;
  applicationEmail: string | null;
};

export type JobDraftForPersistence = JobDraft & {
  normalized: NormalizedJobIdentity;
};
