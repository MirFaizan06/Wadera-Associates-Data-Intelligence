export interface User {
  id: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  profilePicture: string | null;
  isEmailVerified: boolean;
  createdAt: string;
  role: { name: string; permissions: string[] } | null;
}

export interface Dataset {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  defaultUnit: string;
  priceINR: number;
  category: string | null;
  tags: string[] | null;
  isFeatured: boolean;
  source?: string;
  region?: string;
  coverImage?: string | null;
  _count?: { dataPoints: number };
  updatedAt: string;
}

export interface DataPoint {
  date: string;
  value: number;
  unitOverride: string | null;
  note: string | null;
}

export interface LicenseAssignment {
  id: string;
  licenseType: { name: string; permissions: string[]; maxDevices: number | null };
  validFrom: string;
  validTo: string | null;
  isActive: boolean;
  revokedAt: string | null;
}

export interface Purchase {
  id: string;
  amountINR: number;
  status: string;
  purchasedAt: string;
  timeSeries: { name: string; slug: string; defaultUnit: string };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: { code: string; message: string };
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
