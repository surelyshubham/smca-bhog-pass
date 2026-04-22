export interface User {
  uid: string;
  email: string;
  name?: string;
  role: "admin" | "receptionist" | "accountant";
}

export interface Member {
  name: string;
  phone: string;
  familyCount: number;
  spouseName?: string;
  childrenNames?: string[];
}

export interface Event {
  name: string;
  date: string;
  isActive: boolean;
  createdBy: string;
}

export interface Coupon {
  eventId: string;
  memberId?: string;
  holderName: string;
  status: "issued" | "scanned";
  scannedAt?: string; // ISO string representing date
  scannedBy?: string;
  source: "member" | "guest";
}

export interface Payment {
  amount: number;
  trustAccount: "Trust" | "SMCA";
  mode: "Cash" | "Card" | "Online";
  memberName: string;
  collectorUid: string;
  timestamp: string;
}
