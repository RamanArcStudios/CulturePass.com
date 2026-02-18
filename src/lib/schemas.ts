import { z } from "zod";

// ---------------------------------------------------------------------------
// Ticket Schema
// ---------------------------------------------------------------------------
export const ticketSchema = z.object({
  name: z.string().min(1, "Ticket name is required"),
  description: z.string().optional(),
  price: z.number().min(0, "Price must be zero or more"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
});

export type TicketFormValues = z.infer<typeof ticketSchema>;

// ---------------------------------------------------------------------------
// Event Schema
// ---------------------------------------------------------------------------
export const eventSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(120, "Title must be 120 characters or fewer"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(5000, "Description must be 5 000 characters or fewer"),
  category: z.string().min(1, "Category is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  time: z.string().min(1, "Time is required"),
  location: z
    .string()
    .min(3, "Location must be at least 3 characters"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  imageUrl: z.string().optional(),
  published: z.boolean().optional(),
  trending: z.boolean().optional(),
  featured: z.boolean().optional(),
  tickets: z.array(ticketSchema).optional(),
});

export type EventFormValues = z.infer<typeof eventSchema>;

// ---------------------------------------------------------------------------
// Post Schema
// ---------------------------------------------------------------------------
export const postSchema = z.object({
  content: z
    .string()
    .min(10, "Post must be at least 10 characters")
    .max(500, "Post must be 500 characters or fewer"),
});

export type PostFormValues = z.infer<typeof postSchema>;

// ---------------------------------------------------------------------------
// Organisation Schema
// ---------------------------------------------------------------------------
export const organisationSchema = z.object({
  name: z
    .string()
    .min(2, "Organisation name must be at least 2 characters")
    .max(100, "Organisation name must be 100 characters or fewer"),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(60, "Slug must be 60 characters or fewer")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must contain only lowercase letters, numbers and hyphens",
    ),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(2000, "Description must be 2 000 characters or fewer"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  website: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(8, "Phone number must be at least 8 characters"),
  logoUrl: z.string().optional(),
  bannerUrl: z.string().optional(),
  socialLinks: z
    .object({
      facebook: z.string().optional(),
      instagram: z.string().optional(),
      twitter: z.string().optional(),
      youtube: z.string().optional(),
      linkedin: z.string().optional(),
      tiktok: z.string().optional(),
      website: z.string().optional(),
    })
    .optional(),
});

export type OrganisationFormValues = z.infer<typeof organisationSchema>;

// ---------------------------------------------------------------------------
// Customer Details Schema
// ---------------------------------------------------------------------------
export const CustomerDetailsSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(8, "Phone number must be at least 8 characters"),
});

export type CustomerDetailsFormValues = z.infer<typeof CustomerDetailsSchema>;

// ---------------------------------------------------------------------------
// Order Schema
// ---------------------------------------------------------------------------
export const orderSchema = z.object({
  eventId: z.string().min(1, "Event ID is required"),
  eventTitle: z.string().min(1, "Event title is required"),
  amount: z.number().min(0, "Amount must be zero or more"),
  currency: z.string().default("AUD"),
  customerDetails: CustomerDetailsSchema,
  tickets: z
    .array(
      z.object({
        ticketTypeId: z.string().min(1, "Ticket type ID is required"),
        ticketTypeName: z.string().min(1, "Ticket type name is required"),
        quantity: z.number().int().min(1, "Quantity must be at least 1"),
        price: z.number().min(0, "Price must be zero or more"),
      }),
    )
    .min(1, "At least one ticket is required"),
});

export type OrderFormValues = z.infer<typeof orderSchema>;

// ---------------------------------------------------------------------------
// Artist Schema
// ---------------------------------------------------------------------------
export const artistSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be 100 characters or fewer"),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(60, "Slug must be 60 characters or fewer")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must contain only lowercase letters, numbers and hyphens",
    ),
  bio: z
    .string()
    .min(10, "Bio must be at least 10 characters")
    .max(3000, "Bio must be 3 000 characters or fewer"),
  genre: z
    .array(z.string().min(1))
    .min(1, "At least one genre is required"),
  profileImageUrl: z.string().optional(),
  bannerImageUrl: z.string().optional(),
  socialLinks: z
    .object({
      facebook: z.string().optional(),
      instagram: z.string().optional(),
      twitter: z.string().optional(),
      youtube: z.string().optional(),
      linkedin: z.string().optional(),
      tiktok: z.string().optional(),
      website: z.string().optional(),
    })
    .optional(),
  featured: z.boolean().optional(),
});

export type ArtistFormValues = z.infer<typeof artistSchema>;

// ---------------------------------------------------------------------------
// Business Schema
// ---------------------------------------------------------------------------
export const businessSchema = z.object({
  name: z
    .string()
    .min(2, "Business name must be at least 2 characters")
    .max(100, "Business name must be 100 characters or fewer"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(3000, "Description must be 3 000 characters or fewer"),
  categories: z
    .array(z.string().min(1))
    .min(1, "At least one category is required"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  phone: z.string().min(8, "Phone number must be at least 8 characters"),
  email: z.string().email("Please enter a valid email address"),
  website: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  logoUrl: z.string().optional(),
  bannerUrl: z.string().optional(),
  isSponsor: z.boolean().optional(),
  sponsorTier: z.string().optional(),
});

export type BusinessFormValues = z.infer<typeof businessSchema>;

// ---------------------------------------------------------------------------
// Perk Schema
// ---------------------------------------------------------------------------
export const perkSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(120, "Title must be 120 characters or fewer"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(1000, "Description must be 1 000 characters or fewer"),
  businessName: z.string().min(1, "Business name is required"),
  businessId: z.string().min(1, "Business ID is required"),
  code: z
    .string()
    .min(3, "Code must be at least 3 characters")
    .max(30, "Code must be 30 characters or fewer"),
  discountType: z.enum(["percentage", "fixed"]),
  discountValue: z.number().min(0, "Discount value must be zero or more"),
  expiresAt: z.string().min(1, "Expiry date is required"),
});

export type PerkFormValues = z.infer<typeof perkSchema>;

// ---------------------------------------------------------------------------
// Admin Profile Schema
// ---------------------------------------------------------------------------
export const adminProfileSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be 100 characters or fewer"),
  phone: z.string().min(8, "Phone number must be at least 8 characters"),
  socialLinks: z
    .object({
      facebook: z.string().optional(),
      instagram: z.string().optional(),
      twitter: z.string().optional(),
      youtube: z.string().optional(),
      linkedin: z.string().optional(),
      tiktok: z.string().optional(),
      website: z.string().optional(),
    })
    .optional(),
});

export type AdminProfileFormValues = z.infer<typeof adminProfileSchema>;

// ---------------------------------------------------------------------------
// Service Package Schema
// ---------------------------------------------------------------------------
export const servicePackageSchema = z.object({
  name: z
    .string()
    .min(2, "Package name must be at least 2 characters")
    .max(100, "Package name must be 100 characters or fewer"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(1000, "Description must be 1 000 characters or fewer"),
  price: z.number().min(0, "Price must be zero or more"),
  duration: z.string().min(1, "Duration is required"),
  features: z
    .array(z.string().min(1))
    .min(1, "At least one feature is required"),
});

export type ServicePackageFormValues = z.infer<typeof servicePackageSchema>;

// ---------------------------------------------------------------------------
// Service Schema
// ---------------------------------------------------------------------------
export const serviceSchema = z.object({
  name: z
    .string()
    .min(2, "Service name must be at least 2 characters")
    .max(100, "Service name must be 100 characters or fewer"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(2000, "Description must be 2 000 characters or fewer"),
  businessId: z.string().min(1, "Business ID is required"),
  category: z.string().min(1, "Category is required"),
  packages: z
    .array(servicePackageSchema)
    .min(1, "At least one package is required"),
});

export type ServiceFormValues = z.infer<typeof serviceSchema>;

// ---------------------------------------------------------------------------
// Booking Schema
// ---------------------------------------------------------------------------
export const bookingSchema = z.object({
  serviceId: z.string().min(1, "Service ID is required"),
  packageId: z.string().min(1, "Package ID is required"),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  totalAmount: z.number().min(0, "Total amount must be zero or more"),
});

export type BookingFormValues = z.infer<typeof bookingSchema>;
