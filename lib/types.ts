export type Role = "student" | "owner" | "admin";

export type Profile = {
  id: string;
  role: Role;
  name: string;
  email: string | null;
  phone: string | null;
  college: string | null;
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
  status: ListingStatus;
  created_at: string;
  photos?: ListingPhoto[];
};

export type ListingPhoto = {
  id: string;
  listing_id: string;
  path: string;
  position: number;
};

export type PetitionSignature = {
  id: string;
  name: string;
  college: string | null;
  message: string | null;
  created_at: string;
};

export type BuildingReportPublic = {
  locality: string;
  count: number;
};

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

export const COLLEGES = [
  "Hindu College",
  "Ramjas College",
  "Hansraj College",
  "St. Stephen's College",
  "Kirori Mal College",
  "SRCC",
  "Miranda House",
  "Daulat Ram College",
  "Gargi College",
  "Lady Shri Ram College",
  "Jesus & Mary College",
  "Sri Venkateswara College",
  "Atma Ram Sanatan Dharma College",
  "Motilal Nehru College",
  "Deshbandhu College",
  "Dyal Singh College",
  "Zakir Husain Delhi College",
  "Faculty of Law",
  "Delhi School of Economics",
  "Other DU college/department",
] as const;

export const PETITION_TARGET = 2000;
