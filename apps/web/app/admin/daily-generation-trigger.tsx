"use client";

import { useState } from "react";
import { productCopy } from "../../lib/product-copy";
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
        {isRunning
          ? productCopy.admin.runningButton
          : productCopy.admin.runDailyGenerationButton}
      </button>
      {result ? (
        <p className="admin-status">
          {productCopy.admin.dailyGenerationResult(
            result.candidateCount,
            result.dueCount,
            result.attempted,
          )}
        </p>
      ) : null}
      {error ? (
        <p className="admin-status">{productCopy.admin.dailyGenerationError(error)}</p>
      ) : null}
    </div>
  );
}
