export type ResumeUploadInput = {
  userId: string;
  fileName: string;
  mimeType: string;
  byteSize: number;
};

export type PreparedResumeUpload = ResumeUploadInput & {
  storageKey: string;
};
