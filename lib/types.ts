export type Role = "student" | "owner" | "admin";

export type Profile = {
  id: string;
  role: Role;
  name: string;
  email: string | null;
  phone: string | null;
  college: string | null;
  course: string | null;
  admission_year: number | null;
  area: string | null;
  verified: boolean;
  id_upload_path: string | null;
  created_at: string;
};

export type ListingStatus = "active" | "filled" | "removed";

export type Listing = {
  id: string;
  owner_id: string;
  type: string;
  locality: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  campus: string | null;
  walk_minutes: number | null;
  floor: string | null;
  lift: boolean;
  water: string | null;
  backup: string | null;
  rent: number;
  deposit: number;
  maintenance: number;
  electricity: string | null;
  food: boolean;
  leaving_date: string;
  reason_leaving: string | null;
  preferred_tenants: string | null;
  gender_pref: string | null;
  curfew: string | null;
  guests: string | null;
  nonveg: string | null;
  pets: string | null;
  honest_note: string | null;
  owner_name: string | null;
  owner_phone: string | null;
  poster_name: string | null;
  poster_phone: string | null;
  poster_role: Role;
  poster_college: string | null;
  poster_admission_year: number | null;
  status: ListingStatus;
  created_at: string;
  photos?: ListingMedia[];
};

export type ListingMedia = {
  id: string;
  listing_id: string;
  path: string;
  kind: "photo" | "video";
  position: number;
};

export type PetitionSignature = {
  id: string;
  name: string;
  college: string | null;
  created_at: string;
};

export type DangerZoneReport = {
  id: string;
  reporter_id: string;
  locality: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  description: string;
  owner_phone: string | null;
  rent: number | null;
  currently_living: boolean | null;
  status: "open" | "reviewed";
  created_at: string;
  media?: DangerZoneMedia[];
};

export type DangerZoneMedia = {
  id: string;
  report_id: string;
  path: string;
  kind: "photo" | "video";
};

export type YellowZoneRequest = {
  id: string;
  reporter_id: string;
  place_name: string;
  address: string;
  reason: string;
  owner_details: string | null;
  status: "requested" | "in_progress" | "audited";
  audited_at: string | null;
  created_at: string;
};

// Free-text now — students type their own college/department and course
// rather than picking from a maintained dropdown (DU's list is too long
// and too fragmented across independent college domains to keep current).
export const LOCALITIES = [
  "Kamla Nagar",
  "Hudson Lane",
  "Vijay Nagar",
  "GTB Nagar",
  "Mukherjee Nagar",
  "Roop Nagar",
  "Shakti Nagar",
  "Malka Ganj",
  "Patel Chest area",
  "Outram Lines",
  "Satya Niketan",
  "Dhaula Kuan",
  "Moti Bagh",
  "Katwaria Sarai",
  "Ber Sarai",
  "Other",
] as const;

export const LISTING_TYPES = [
  "Full flat",
  "Shared flat",
  "Single room",
  "PG bed (shared room)",
  "PG single room",
] as const;

export const PETITION_TARGET = 2000;

// Only these email domains auto-verify a student instantly. Anything else
// (including legitimate colleges on their own non-du.ac.in domain) falls
// back to manual ID review in the admin panel rather than being rejected
// outright, since DU's domain scheme isn't fully consistent college to
// college. Add more exact domains here as you confirm them.
export const KNOWN_DU_DOMAINS: string[] = [
  // add specific non-"*.du.ac.in" college domains here as you confirm them,
  // e.g. "arsdcollege.ac.in"
];

export function isDuEmail(email: string): boolean {
  const domain = (email.split("@")[1] || "").toLowerCase();
  if (!domain) return false;
  if (domain.endsWith("du.ac.in")) return true;
  return KNOWN_DU_DOMAINS.includes(domain);
}

// Rough year-of-study label from admission year, for the anonymous poster
// byline ("Posted by a third year Hindu College student"). DU's academic
// year starts roughly in July/August, so before that month we treat the
// person as still in the previous academic year.
export function yearOfStudyLabel(admissionYear: number | null | undefined): string {
  if (!admissionYear) return "a";
  const now = new Date();
  const academicYear = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
  const year = academicYear - admissionYear + 1;
  const labels: Record<number, string> = {
    1: "a first year",
    2: "a second year",
    3: "a third year",
    4: "a fourth year",
    5: "a fifth year",
  };
  if (year <= 0) return "an incoming";
  return labels[year] || `a ${year}th year`;
}
