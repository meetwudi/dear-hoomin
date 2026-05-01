export function cleanThoughtText(text: string) {
  return text
    .trim()
    .replace(/^["'“”‘’\s]+|["'“”‘’\s]+$/g, "")
    .replace(
      /^(today(?:'s| is|’s)?\s+(?:thought|mission|journal|plan)|(?:thought|mission|journal)\s+for\s+today|mission|thought)\s*[:\-–—]\s*/i,
      "",
    )
    .trim();
}
