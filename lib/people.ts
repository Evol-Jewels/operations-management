import type { PersonSummary } from "@/types";

export type PersonLike = PersonSummary | string | null | undefined;

export function normalizePerson(
  person: PersonLike,
  fallbackName = "Unknown user",
): PersonSummary {
  if (!person) {
    return { id: "unknown", name: fallbackName, image: null };
  }

  if (typeof person === "string") {
    return { id: person, name: person || fallbackName, image: null };
  }

  return {
    id: person.id,
    name: person.name || fallbackName,
    image: person.image ?? null,
  };
}

export function getFirstName(person: PersonLike, fallbackName = "Unknown") {
  const normalized = normalizePerson(person, fallbackName);
  return normalized.name.trim().split(/\s+/)[0] ?? fallbackName;
}

export function getInitials(person: PersonLike, fallbackName = "Unknown") {
  const normalized = normalizePerson(person, fallbackName);
  return (
    normalized.name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}
