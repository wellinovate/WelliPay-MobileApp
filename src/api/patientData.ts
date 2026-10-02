import { patientApiRequest, newIdempotencyKey } from './client';

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

export interface ApiHmoPolicy {
  hmoPolicyId: string;
  patientRef: string;
  provider: string;
  policyNo: string;
  enrolleeName: string;
  planTier: string;
  coPayPercent: number;
  annualLimit: { amountMinor: number; currency: string };
  usedAmount: { amountMinor: number; currency: string };
  status: 'ACTIVE' | 'PENDING' | 'EXPIRED';
  expiryDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHmoPolicyInput {
  provider: string;
  policyNo: string;
  enrolleeName: string;
  planTier: string;
  coPayPercent: number;
  annualLimitMinor: number;
  currency?: string;
  expiryDate?: string;
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

export async function fetchHmoPolicies(): Promise<ApiHmoPolicy[]> {
  const res = await patientApiRequest<ListResponse<ApiHmoPolicy>>('/patient/hmo-policies');
  return res.items;
}

// AddHmoScreen's "Verify & Link HMO" — records the patient's own HMO card.
// currency defaults to NGN since that's the only currency the app's amount
// pickers (and NAIRA()) support today.
export async function createHmoPolicy(input: CreateHmoPolicyInput): Promise<ApiHmoPolicy> {
  return patientApiRequest<ApiHmoPolicy>('/patient/hmo-policies', {
    method: 'POST',
    body: { currency: 'NGN', ...input },
    idempotencyKey: newIdempotencyKey(),
  });
}

export interface ApiPreAuth {
  preAuthId: string;
  patientRef: string;
  hmoPolicyId: string;
  facilityRef: string;
  procedure: string;
  estimatedCost: { amountMinor: number; currency: string };
  coveredAmount: { amountMinor: number; currency: string };
  patientPortion: { amountMinor: number; currency: string };
  status: 'APPROVED' | 'IN_REVIEW' | 'DECLINED';
  approvalCode?: string;
  notes?: string;
  requestedAt: string;
}

export interface CreatePreAuthInput {
  hmoPolicyId: string;
  facilityRef: string;
  procedure: string;
  estimatedCostMinor: number;
}

export async function fetchPreAuthorizations(): Promise<ApiPreAuth[]> {
  const res = await patientApiRequest<ListResponse<ApiPreAuth>>('/patient/pre-authorizations');
  return res.items;
}

// PreAuthScreen's "Request Instant Approval". wellipay-api resolves it
// synchronously (no real payer integration exists yet — see the schema
// comment on PreAuthorization) and returns the final decision in the
// response, same as createHmoPolicy above.
export async function createPreAuthorization(input: CreatePreAuthInput): Promise<ApiPreAuth> {
  return patientApiRequest<ApiPreAuth>('/patient/pre-authorizations', {
    method: 'POST',
    body: input,
    idempotencyKey: newIdempotencyKey(),
  });
}

export interface ApiReconciliationItem {
  claimId: string;
  providerClaimRef: string;
  invoiceId: string;
  providerInvoiceRef?: string;
  description?: string;
  facilityRef: string;
  payerRef: string;
  claimStatus: string;
  expectedAmount: { amountMinor: number; currency: string };
  receivedAmount: { amountMinor: number; currency: string };
  variance: { amountMinor: number; currency: string };
  reconciliationStatus: 'UNDERPAID' | 'OVERPAID' | 'RECONCILED';
  decidedAt?: string;
}

export interface ApiReconciliationTotals {
  totalExpectedMinor: number;
  totalReceivedMinor: number;
  totalVarianceMinor: number;
}

// HmoReconcileScreen ("WelliPay Reconcile™"): compares what an HMO
// approved on each of the patient's claims against what has actually been
// remitted for the matching invoice — derived entirely from existing
// Claim + Payment data server-side, nothing simulated client-side.
export async function fetchClaimReconciliation(): Promise<{ items: ApiReconciliationItem[]; totals: ApiReconciliationTotals }> {
  return patientApiRequest<{ items: ApiReconciliationItem[]; totals: ApiReconciliationTotals; nextCursor?: string }>(
    '/patient/claims/reconciliation'
  );
}

export interface ApiEpisodeItem {
  invoiceId: string;
  providerInvoiceRef: string;
  category: string;
  description: string;
  date: string;
  totalCost: { amountMinor: number; currency: string };
  hmoContribution: { amountMinor: number; currency: string };
  patientSelfPay: { amountMinor: number; currency: string };
  paid: { amountMinor: number; currency: string };
  status: 'cleared' | 'partly_paid' | 'unpaid';
}

export interface ApiEpisode {
  episodeRef: string;
  facilityRef: string;
  patientRef: string;
  startDate: string;
  endDate?: string;
  status: 'active' | 'completed';
  items: ApiEpisodeItem[];
  totalCost: { amountMinor: number; currency: string };
  hmoCover: { amountMinor: number; currency: string };
  patientSelfPay: { amountMinor: number; currency: string };
  patientPaid: { amountMinor: number; currency: string };
  patientDue: { amountMinor: number; currency: string };
  depositPaid: { amountMinor: number; currency: string };
  hmoReceivable: {
    expected: { amountMinor: number; currency: string };
    received: { amountMinor: number; currency: string };
    variance: { amountMinor: number; currency: string };
    status: 'UNDERPAID' | 'OVERPAID' | 'RECONCILED';
  };
}

// EpisodeTimelineScreen: groups the patient's own invoices that a provider
// tagged with the same metadata.episodeRef (see wellipay-api's episodes.ts)
// into one "healthcare episode" — nothing simulated client-side. Invoices
// with no episodeRef tag simply never appear in an episode. depositPaid is
// always 0 for now — no deposit concept exists in the backend yet.
export async function fetchEpisodes(): Promise<ApiEpisode[]> {
  const res = await patientApiRequest<{ items: ApiEpisode[] }>('/patient/episodes');
  return res.items;
}
