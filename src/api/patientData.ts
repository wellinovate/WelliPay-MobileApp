import { patientApiRequest } from './client';

// Mirrors wellipay-api's serializeInvoice/serializeFundingRequest/
// serializeEligibilityCheck/serializeConsent (src/routes/patientData.ts).
// Every amount is in minor units (kobo) — convert with /100 before
// handing to NAIRA(), which expects major units.

export interface ApiInvoice {
  invoiceId: string;
  providerInvoiceRef: string;
  facilityRef: string;
  description: string;
  amountMinor: number;
  currency: string;
  paidAmountMinor: number;
  status: 'OPEN' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED';
  mobileDeliveryStatus: string;
  dueAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiFundingContribution {
  contributionId: string;
  sponsorRef: string;
  amountMinor: number;
  status: string;
}

export interface ApiFundingRequest {
  requestId: string;
  providerRequestRef: string;
  invoiceId: string;
  status: string;
  fundedAmountMinor: number;
  currency: string;
  expiresAt?: string;
  createdAt: string;
  contributions: ApiFundingContribution[];
}

export interface ApiEligibilityCheck {
  eligibilityId: string;
  facilityRef: string;
  payerRef: string;
  status: string;
  decision: string;
  reasonCode?: string;
  coveredAmount?: { amountMinor: number; currency: string };
  patientResponsibility?: { amountMinor: number; currency: string };
  validUntil?: string;
  requestedAt: string;
  checkedAt: string;
}

export interface ApiConsent {
  consentId: string;
  facilityRef: string;
  invoiceId: string;
  status: string;
  recordedAt: string;
}

interface ListResponse<T> {
  items: T[];
  nextCursor?: string;
}

export async function fetchInvoices(): Promise<ApiInvoice[]> {
  const res = await patientApiRequest<ListResponse<ApiInvoice>>('/patient/invoices');
  return res.items;
}

export async function fetchInvoice(invoiceId: string): Promise<ApiInvoice> {
  return patientApiRequest<ApiInvoice>(`/patient/invoices/${encodeURIComponent(invoiceId)}`);
}

export async function fetchFamilyFundingRequests(): Promise<ApiFundingRequest[]> {
  const res = await patientApiRequest<ListResponse<ApiFundingRequest>>('/patient/family-funding-requests');
  return res.items;
}

export async function fetchEligibilityChecks(): Promise<ApiEligibilityCheck[]> {
  const res = await patientApiRequest<ListResponse<ApiEligibilityCheck>>('/patient/eligibility-checks');
  return res.items;
}

export async function fetchFinancialConsents(): Promise<ApiConsent[]> {
  const res = await patientApiRequest<ListResponse<ApiConsent>>('/patient/financial-consents');
  return res.items;
}
