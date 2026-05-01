export type AppStoredObject = {
  key: string;
  contentType: string;
};

export type AppDownloadedObject = {
  contentType: string;
  bytes: Buffer;
};

export type AppStorage = {
  uploadObject(input: {
    key: string;
    contentType: string;
    bytes: Buffer;
  }): Promise<AppStoredObject>;
  downloadObject(key: string): Promise<AppDownloadedObject | null>;
};
