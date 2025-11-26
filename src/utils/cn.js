export function cn(...inputs) {
  const classes = inputs
    .filter(Boolean)
    .map((input) => {
      if (typeof input === "string") return input
      if (typeof input === "object" && input !== null) {
        return Object.entries(input)
          .filter(([_, value]) => Boolean(value))
          .map(([key]) => key)
          .join(" ")
      }
      return ""
    })
    .filter(Boolean)
    .join(" ")
  
  // Simple deduplication for common Tailwind classes
  return classes
}

