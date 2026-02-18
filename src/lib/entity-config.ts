export const ENTITY_PREFIXES = {
  user: "CP-U-",
  artist: "CP-AR-",
  business: "CP-B-",
  organisation: "CP-ORG-",
  event: "CP-E-",
  venue: "CP-V-",
  perk: "CP-PK-",
} as const;

export type EntityType = keyof typeof ENTITY_PREFIXES;
