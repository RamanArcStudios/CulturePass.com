/**
 * CulturePass – Shared Type Definitions for Mobile
 *
 * Mirrors the web app types from src/lib/types.ts.
 * Same Firebase backend, same data structures.
 */

// ---------------------------------------------------------------------------
// Social Links
// ---------------------------------------------------------------------------
export interface SocialLinks {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  youtube?: string;
  linkedin?: string;
  tiktok?: string;
  website?: string;
}

// ---------------------------------------------------------------------------
// ROLE & PERMISSION MATRIX
// ---------------------------------------------------------------------------

export type PlatformRole = "user" | "moderator" | "superadmin";

export type EntityRole =
  | "owner"
  | "admin"
  | "event_manager"
  | "finance_manager"
  | "content_editor"
  | "member";

export type EntityStatus = "pending" | "approved" | "rejected" | "suspended";

export type EntityType =
  | "user"
  | "artist"
  | "business"
  | "organisation"
  | "event"
  | "venue"
  | "perk";

export interface EntityRoleAssignment {
  entityId: string;
  entityType: EntityType;
  userId: string;
  role: EntityRole;
  assignedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------
export type WithId<T> = T & { id: string };

// ---------------------------------------------------------------------------
// User Profile
// ---------------------------------------------------------------------------
export interface UserProfile {
  cpid: string;
  name: string;
  email: string;
  phone: string;
  photoUrl: string;
  role_global: PlatformRole;
  memberships: Record<string, string>;
  savedItems: {
    events: string[];
    artists: string[];
    businesses: string[];
  };
  affiliateId: string;
  socialLinks: SocialLinks;
  isBanned?: boolean;
  bannedReason?: string;
  bannedAt?: Date;
  twoFactorEnabled?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ---------------------------------------------------------------------------
// Organisation
// ---------------------------------------------------------------------------
export interface Organisation {
  cpid: string;
  name: string;
  slug: string;
  description: string;
  city: string;
  state: string;
  status: EntityStatus;
  visibility: "public" | "hidden";
  eventsEnabled: boolean;
  logoUrl: string;
  bannerUrl: string;
  website: string;
  email: string;
  phone: string;
  socialLinks: SocialLinks;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// ---------------------------------------------------------------------------
// Event
// ---------------------------------------------------------------------------
export interface CultureEvent {
  cpid: string;
  title: string;
  description: string;
  category: string;
  startDate: Date;
  endDate: Date;
  time: string;
  location: string;
  city: string;
  state: string;
  imageUrl: string;
  orgId: string;
  orgName: string;
  published: boolean;
  trending: boolean;
  featured: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// ---------------------------------------------------------------------------
// Artist
// ---------------------------------------------------------------------------
export interface Artist {
  cpid: string;
  name: string;
  slug: string;
  bio: string;
  genre: string[];
  profileImageUrl: string;
  bannerImageUrl: string;
  socialLinks: SocialLinks;
  status: EntityStatus;
  featured: boolean;
  ownerId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// ---------------------------------------------------------------------------
// Business
// ---------------------------------------------------------------------------
export interface Business {
  cpid: string;
  name: string;
  description: string;
  categories: string[];
  address: string;
  city: string;
  state: string;
  phone: string;
  email: string;
  website: string;
  logoUrl: string;
  bannerUrl: string;
  ownerId: string;
  status: EntityStatus;
  isSponsor: boolean;
  sponsorTier: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// ---------------------------------------------------------------------------
// Ticket Type
// ---------------------------------------------------------------------------
export interface TicketType {
  name: string;
  description: string;
  price: number;
  quantity: number;
  sold: number;
}

// ---------------------------------------------------------------------------
// Order
// ---------------------------------------------------------------------------
export interface Order {
  userId: string;
  eventId: string;
  eventTitle: string;
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed" | "refunded";
  stripePaymentIntentId: string;
  customerDetails: {
    name: string;
    email: string;
    phone: string;
  };
  tickets: {
    ticketTypeId: string;
    ticketTypeName: string;
    quantity: number;
    price: number;
  }[];
  createdAt: Date;
}

// ---------------------------------------------------------------------------
// Perk
// ---------------------------------------------------------------------------
export interface Perk {
  title: string;
  description: string;
  businessName: string;
  businessId: string;
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  status: "active" | "inactive";
  expiresAt: Date;
  createdAt: Date;
}

// ---------------------------------------------------------------------------
// Notification
// ---------------------------------------------------------------------------
export interface Notification {
  type: string;
  title: string;
  message: string;
  read: boolean;
  userId: string;
  entityId: string;
  entityType: EntityType;
  createdAt: Date;
}
