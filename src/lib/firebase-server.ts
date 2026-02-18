import {
  collection,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";

import { initializeFirebase, getSdks } from "@/firebase/index";
import type {
  WithId,
  Event,
  Organisation,
  Artist,
  Business,
  Venue,
  Perk,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Ensure Firebase is initialised before any server-side query. */
function db() {
  initializeFirebase();
  return getSdks().db;
}

/** Map a Firestore snapshot array to typed documents with `id`. */
function mapDocs<T extends DocumentData>(
  docs: QueryDocumentSnapshot[],
): WithId<T>[] {
  return docs.map((d) => ({ id: d.id, ...(d.data() as T) }));
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export async function getEvents(): Promise<WithId<Event>[]> {
  const q = query(
    collection(db(), "events"),
    where("published", "==", true),
    orderBy("startDate", "asc"),
  );
  const snapshot = await getDocs(q);
  return mapDocs<Event>(snapshot.docs);
}

export async function getEvent(id: string): Promise<WithId<Event> | null> {
  const ref = doc(db(), "events", id);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...(snapshot.data() as Event) };
}

// ---------------------------------------------------------------------------
// Organisations
// ---------------------------------------------------------------------------

export async function getOrganisations(): Promise<WithId<Organisation>[]> {
  const q = query(collection(db(), "organisations"), orderBy("name", "asc"));
  const snapshot = await getDocs(q);
  return mapDocs<Organisation>(snapshot.docs);
}

export async function getOrganisation(
  id: string,
): Promise<WithId<Organisation> | null> {
  const ref = doc(db(), "organisations", id);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...(snapshot.data() as Organisation) };
}

// ---------------------------------------------------------------------------
// Artists
// ---------------------------------------------------------------------------

export async function getArtists(): Promise<WithId<Artist>[]> {
  const q = query(collection(db(), "artists"), orderBy("name", "asc"));
  const snapshot = await getDocs(q);
  return mapDocs<Artist>(snapshot.docs);
}

export async function getArtist(slug: string): Promise<WithId<Artist> | null> {
  const q = query(collection(db(), "artists"), where("slug", "==", slug));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const d = snapshot.docs[0];
  return { id: d.id, ...(d.data() as Artist) };
}

// ---------------------------------------------------------------------------
// Businesses
// ---------------------------------------------------------------------------

export async function getBusinesses(): Promise<WithId<Business>[]> {
  const q = query(collection(db(), "businesses"), orderBy("name", "asc"));
  const snapshot = await getDocs(q);
  return mapDocs<Business>(snapshot.docs);
}

export async function getBusiness(
  id: string,
): Promise<WithId<Business> | null> {
  const ref = doc(db(), "businesses", id);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...(snapshot.data() as Business) };
}

// ---------------------------------------------------------------------------
// Venues
// ---------------------------------------------------------------------------

export async function getVenues(): Promise<WithId<Venue>[]> {
  const q = query(collection(db(), "venues"), orderBy("name", "asc"));
  const snapshot = await getDocs(q);
  return mapDocs<Venue>(snapshot.docs);
}

// ---------------------------------------------------------------------------
// Perks
// ---------------------------------------------------------------------------

export async function getPerks(): Promise<WithId<Perk>[]> {
  const q = query(
    collection(db(), "perks"),
    where("status", "==", "active"),
    orderBy("title", "asc"),
  );
  const snapshot = await getDocs(q);
  return mapDocs<Perk>(snapshot.docs);
}
