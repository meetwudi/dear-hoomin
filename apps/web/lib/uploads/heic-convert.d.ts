declare module "heic-convert" {
  type ConvertOptions = {
    buffer: Buffer;
    format: "JPEG" | "PNG";
    quality?: number;
  };

  export default function convertHeic(options: ConvertOptions): Promise<ArrayBuffer>;
}
