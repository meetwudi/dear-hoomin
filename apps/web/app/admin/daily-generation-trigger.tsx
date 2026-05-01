"use client";

import { useState } from "react";
import { triggerDailyGenerationAction } from "./actions";

type DailyGenerationResult = Awaited<
  ReturnType<typeof triggerDailyGenerationAction>
>;

export function DailyGenerationTrigger() {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<DailyGenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="admin-tool">
      <button
        className="primary-button"
        disabled={isRunning}
        onClick={async () => {
          setIsRunning(true);
          setError(null);

          try {
            setResult(await triggerDailyGenerationAction());
          } catch (caughtError) {
            setError(
              caughtError instanceof Error
                ? caughtError.message
                : "daily_generation_failed",
            );
          } finally {
            setIsRunning(false);
          }
        }}
        type="button"
      >
        {isRunning ? "Running..." : "Run daily generation now"}
      </button>
      {result ? (
        <p className="admin-status">
          Checked {result.candidateCount} candidates for their current local
          dates, found {result.dueCount} needing images, attempted{" "}
          {result.attempted}.
        </p>
      ) : null}
      {error ? <p className="admin-status">Not run: {error}</p> : null}
    </div>
  );
}
