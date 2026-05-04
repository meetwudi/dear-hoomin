import { productCopy } from "../product-copy";

export function formatThoughtDate(localDate: string | null | undefined) {
  if (!localDate) {
    return productCopy.dates.todayFallback;
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${localDate}T00:00:00.000Z`));
}
