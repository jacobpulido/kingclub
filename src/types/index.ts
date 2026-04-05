// User and Authentication
export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  role: "admin" | "member";
  preferred_cut?: "brief" | "trunk" | "boxer_brief";
  preferred_size?: "XS" | "S" | "M" | "L" | "XL" | "XXL";
  created_at: string;
  updated_at: string;
}

// Plans
export interface Plan {
  id: string;
  name: string;
  description?: string;
  price: number;
  billing_period: "monthly" | "bimonthly";
  is_active: boolean;
}

// Membership
export type MembershipStatus =
  | "pending_activation"
  | "active"
  | "past_due"
  | "paused"
  | "cancelled"
  | "expired";

export interface Membership {
  id: string;
  profile_id: string;
  plan_id: string;
  status: MembershipStatus;
  start_date?: string;
  end_date?: string;
  next_billing_date?: string;
  cancellation_date?: string;
  cancellation_reason?: string;
  created_at: string;
  updated_at: string;
}

// Address
export interface Address {
  id: string;
  profile_id: string;
  street: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  is_default: boolean;
}

// Payment
export type PaymentStatus = "pending" | "completed" | "failed" | "refunded";

export interface Payment {
  id: string;
  membership_id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  payment_method?: string;
  paid_at?: string;
  failed_at?: string;
  failure_reason?: string;
  external_id?: string;
  created_at: string;
}

// Kit
export interface Kit {
  id: string;
  name: string;
  month: number;
  year: number;
  description?: string;
  items: KitItem[];
  is_active: boolean;
  created_at: string;
}

export interface KitItem {
  name: string;
  category: string;
  quantity: number;
}

// Kit Assignment
export interface KitAssignment {
  id: string;
  kit_id: string;
  membership_id: string;
  assigned_at: string;
}

// Shipment
export type ShipmentStatus =
  | "preparing"
  | "packed"
  | "shipped"
  | "in_transit"
  | "delivered";

export interface Shipment {
  id: string;
  assignment_id: string;
  status: ShipmentStatus;
  tracking_number?: string;
  carrier?: string;
  shipped_at?: string;
  delivered_at?: string;
  notes?: string;
}

// Incident
export type IncidentType =
  | "size_change"
  | "address_change"
  | "payment_failed"
  | "packing_error"
  | "return"
  | "other";

export type IncidentStatus = "open" | "in_progress" | "resolved";

export interface Incident {
  id: string;
  membership_id: string;
  type: IncidentType;
  status: IncidentStatus;
  description: string;
  resolution_notes?: string;
  created_at: string;
  resolved_at?: string;
  resolved_by?: string;
}

// Activity Log
export interface ActivityLog {
  id: string;
  user_id?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  metadata: Record<string, unknown>;
  created_at: string;
}
