import { Timestamp } from "firebase/firestore";
import { EntityType } from "./entity-config";

// ---------------------------------------------------------------------------
// Generic utility type -- adds a Firestore document ID to any interface
// ---------------------------------------------------------------------------
export type WithId<T> = T & { id: string };

// ---------------------------------------------------------------------------
// Social links -- reusable across multiple entities
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
// 🔐 ROLE & PERMISSION MATRIX
// ---------------------------------------------------------------------------

// ---- Platform-Level Roles (Global) ----
export type PlatformRole = "user" | "moderator" | "superadmin";

// ---- Entity-Level Roles (Per Community / Business / Artist / Venue) ----
export type EntityRole =
  | "owner"
  | "admin"
  | "event_manager"
  | "finance_manager"
  | "content_editor"
  | "member";

// ---- Entity Status (with suspended state for approval workflow) ----
export type EntityStatus = "pending" | "approved" | "rejected" | "suspended";

// ---- Entity Role Document (stored in entity_roles collection) ----
export interface EntityRoleAssignment {
  entityId: string;
  entityType: EntityType;
  userId: string;
  role: EntityRole;
  assignedBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ---- Audit Log Entry (immutable) ----
export type AuditAction =
  | "role_change"
  | "entity_approval"
  | "entity_rejection"
  | "entity_suspension"
  | "refund_issued"
  | "refund_approved"
  | "ticket_price_change"
  | "entity_created"
  | "entity_deleted"
  | "ownership_transfer"
  | "user_banned"
  | "user_unbanned"
  | "perk_created"
  | "perk_deleted"
  | "settings_changed"
  | "sponsor_placement"
  | "financial_override";

export interface AuditLog {
  action: AuditAction;
  performedBy: string;
  performedByEmail: string;
  targetEntityId: string;
  targetEntityType: EntityType | "user" | "platform";
  details: Record<string, unknown>;
  ipAddress?: string;
  createdAt: Timestamp;
}

// ---- Entity Approval Record (tracks approval workflow) ----
export interface EntityApproval {
  entityId: string;
  entityType: EntityType;
  status: EntityStatus;
  reviewedBy?: string;
  reviewedAt?: Timestamp;
  rejectionReason?: string;
  suspensionReason?: string;
  previousStatus?: EntityStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ---- Revenue Safety - Stripe Connect Status ----
export interface PaymentSetup {
  entityId: string;
  entityType: "organisation" | "business";
  stripeConnectAccountId?: string;
  stripeAccountVerified: boolean;
  payoutAccountConnected: boolean;
  refundPolicySet: boolean;
  ticketSalesEnabled: boolean;
  updatedAt: Timestamp;
}

// ---------------------------------------------------------------------------
// Community Post
// ---------------------------------------------------------------------------
export interface Post {
  content: string;
  authorId: string;
  authorName: string;
  likeCount: number;
  likedBy: string[];
  orgId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
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
  /** Hidden until approved; hidden again if suspended */
  visibility: "public" | "hidden";
  /** Events cannot be created until entity is approved */
  eventsEnabled: boolean;
  logoUrl: string;
  bannerUrl: string;
  website: string;
  email: string;
  phone: string;
  socialLinks: SocialLinks;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ---------------------------------------------------------------------------
// User Profile
// ---------------------------------------------------------------------------
export interface UserProfile {
  cpid: string;
  name: string;
  email: string;
  phone: string;
  photoUrl: string;
  /** Platform-level role: user, moderator, or superadmin */
  role_global: PlatformRole;
  /** Maps an organisation/entity ID to the user's role within that entity */
  memberships: Record<string, string>;
  savedItems: {
    events: string[];
    artists: string[];
    businesses: string[];
  };
  affiliateId: string;
  socialLinks: SocialLinks;
  /** Whether this user is banned from the platform */
  isBanned?: boolean;
  bannedReason?: string;
  bannedAt?: Timestamp;
  /** Two-factor auth enabled (mandatory for superadmin) */
  twoFactorEnabled?: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
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
  createdAt: Timestamp;
}

// ---------------------------------------------------------------------------
// Event
// ---------------------------------------------------------------------------
export interface Event {
  cpid: string;
  title: string;
  description: string;
  category: string;
  startDate: Timestamp;
  endDate: Timestamp;
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
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ---------------------------------------------------------------------------
// Order
// ---------------------------------------------------------------------------
export interface OrderTicketItem {
  ticketTypeId: string;
  ticketTypeName: string;
  quantity: number;
  price: number;
}

export interface CustomerDetails {
  name: string;
  email: string;
  phone: string;
}

export interface Order {
  userId: string;
  eventId: string;
  eventTitle: string;
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed" | "refunded";
  stripePaymentIntentId: string;
  customerDetails: CustomerDetails;
  tickets: OrderTicketItem[];
  createdAt: Timestamp;
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
  createdAt: Timestamp;
  updatedAt: Timestamp;
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
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ---------------------------------------------------------------------------
// Venue
// ---------------------------------------------------------------------------
export interface Venue {
  cpid: string;
  name: string;
  slug: string;
  description: string;
  address: string;
  city: string;
  state: string;
  capacity: number;
  imageUrl: string;
  ownerId: string;
  ownerType: "organisation" | "business" | "user";
  facilities: string[];
  pricing: string;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ---------------------------------------------------------------------------
// Bookable Space (sub-entity of Venue)
// ---------------------------------------------------------------------------
export interface BookableSpace {
  name: string;
  description: string;
  capacity: number;
  amenities: string[];
  pricing: string;
  venueId: string;
}

// ---------------------------------------------------------------------------
// Slot (sub-entity of BookableSpace)
// ---------------------------------------------------------------------------
export interface Slot {
  date: string;
  startTime: string;
  endTime: string;
  spaceId: string;
  status: "available" | "booked" | "blocked";
}

// ---------------------------------------------------------------------------
// Venue Booking
// ---------------------------------------------------------------------------
export interface VenueBooking {
  venueId: string;
  spaceId: string;
  slotId: string;
  userId: string;
  status: "pending" | "confirmed" | "cancelled";
  totalAmount: number;
  createdAt: Timestamp;
}

// ---------------------------------------------------------------------------
// Ticket Type (sub-entity of Event)
// ---------------------------------------------------------------------------
export interface TicketType {
  name: string;
  description: string;
  price: number;
  quantity: number;
  sold: number;
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
  expiresAt: Timestamp;
  createdAt: Timestamp;
}

// ---------------------------------------------------------------------------
// Service Package
// ---------------------------------------------------------------------------
export interface ServicePackage {
  name: string;
  description: string;
  price: number;
  duration: string;
  features: string[];
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------
export interface Service {
  name: string;
  description: string;
  businessId: string;
  category: string;
  packages: ServicePackage[];
}

// ---------------------------------------------------------------------------
// Booking (for Services)
// ---------------------------------------------------------------------------
export interface Booking {
  serviceId: string;
  userId: string;
  packageId: string;
  date: string;
  time: string;
  status: "pending" | "confirmed" | "cancelled";
  totalAmount: number;
  createdAt: Timestamp;
}

// ---------------------------------------------------------------------------
// Certificate
// ---------------------------------------------------------------------------
export interface Certificate {
  type: "verified" | "premium" | "cultural_excellence";
  entityId: string;
  entityType: EntityType;
  issuedAt: Timestamp;
  expiresAt: Timestamp;
}

// ---------------------------------------------------------------------------
// CPID Registry Entry
// ---------------------------------------------------------------------------
export interface CPIDEntry {
  cpid: string;
  entityType: EntityType;
  entityId: string;
  createdAt: Timestamp;
}
