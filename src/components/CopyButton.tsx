import { useState } from "react";

type CopyButtonProps = {
  text: string;
  label?: string;
  onCopySuccess?: () => void;
  onCopyError?: (error: Error) => void;
  variant?: "icon" | "text";
  size?: "sm" | "md";
};

export default function CopyButton({
  text,
  label = "Copy",
  onCopySuccess,
  onCopyError,
  variant = "icon",
  size = "md"
}: CopyButtonProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCopy = async () => {
    try {
      setError(null);
      
      if (!navigator.clipboard) {
        throw new Error("Clipboard API not available in this browser");
      }

      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      onCopySuccess?.();

      // Reset the "copied" state after 2 seconds
      const timer = setTimeout(() => {
        setIsCopied(false);
      }, 2000);

      return () => clearTimeout(timer);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error.message);
      onCopyError?.(error);
      console.warn("Failed to copy to clipboard:", error);
    }
  };

  if (variant === "text") {
    return (
      <button
        type="button"
        onClick={handleCopy}
        aria-label={label}
        className={`${
          size === "sm" ? "text-xs px-2 py-1" : "text-sm px-3 py-2"
        } rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100/30 dark:bg-slate-900/30 text-slate-600 dark:text-slate-300 transition hover:bg-slate-200/50 dark:hover:bg-slate-900/60 disabled:opacity-50 disabled:cursor-not-allowed font-medium`}
        disabled={isCopied}
        title={error || `${isCopied ? "Copied!" : label}`}
      >
        {isCopied ? "✓ Copied!" : label}
      </button>
    );
  }

  // Icon variant (default)
  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={label}
      className={`${
        size === "sm"
          ? "h-7 w-7"
          : "h-9 w-9"
      } inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100/30 dark:bg-slate-900/30 text-slate-600 dark:text-slate-300 transition hover:bg-slate-200/50 dark:hover:bg-slate-900/60 disabled:opacity-50 disabled:cursor-not-allowed`}
      disabled={isCopied}
      title={error || `${isCopied ? "Copied!" : label}`}
    >
      {isCopied ? (
        // Checkmark SVG
        <svg
          className={`${size === "sm" ? "h-4 w-4" : "h-5 w-5"} text-emerald-500`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        // Copy SVG
        <svg
          className={`${size === "sm" ? "h-4 w-4" : "h-5 w-5"}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
      )}
    </button>
  );
}
