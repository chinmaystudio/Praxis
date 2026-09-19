"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div style={{ background: "#000", color: "#fff", padding: "2rem", fontFamily: "sans-serif" }}>
      <h2>Something went wrong!</h2>
      <p style={{ color: "#aaa" }}>{error?.message || "An unexpected error occurred."}</p>
      <button
        onClick={() => reset()}
        style={{
          padding: "0.5rem 1rem",
          marginTop: "1rem",
          cursor: "pointer",
          background: "#00ff9c",
          color: "#000",
          border: "none",
          borderRadius: "4px",
          fontWeight: "bold",
        }}
      >
        Try again
      </button>
    </div>
  );
}
