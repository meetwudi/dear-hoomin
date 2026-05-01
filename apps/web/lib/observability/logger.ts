import pino from "pino";

const logLevel = "info";

export const logger = pino({
  name: "dear-hoomin-web",
  level: logLevel,
  base: undefined,
});

export function generationLogger(context: Record<string, string | null>) {
  return logger.child({
    area: "generation",
    ...context,
  });
}
