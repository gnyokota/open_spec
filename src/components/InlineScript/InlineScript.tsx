/**
 * Renders a script that runs during HTML parsing on full page loads. On the
 * client it becomes inert `text/plain`, which avoids React's dev warning about
 * rendering <script> tags; suppressHydrationWarning covers the type mismatch.
 */
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
