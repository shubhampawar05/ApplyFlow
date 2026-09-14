export type JobScreenshotUploadInput = {
  userId: string;
  fileName: string;
  mimeType: string;
  byteSize: number;
};

export type PreparedJobScreenshotUpload = JobScreenshotUploadInput & {
  storageKey: string;
};
