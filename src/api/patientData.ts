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

// GET /patient/results — ready results for tests the lab delivers digitally.
export interface ApiPatientResult {
  resultId: string;
  bookingId: string;
  kind: 'LAB' | 'IMAGING';
  testName: string;
  resultText?: string;
  abnormal: boolean;
  takenOn: string;
  readyAt?: string;
}

export interface ApiPatientResults {
  items: ApiPatientResult[];
  inPersonCount: number;
}

export async function fetchPatientResults(): Promise<ApiPatientResults> {
  return patientApiRequest<ApiPatientResults>('/patient/results');
}

// Payments. Mirrors wellipay-api src/routes/patientPay.ts.
export interface ApiTransactionLine {
  description: string;
  quantity: number;
  unitPriceMinor: number;
}

export interface ApiTransaction {
  transactionId: string;
  reference: string;
  processor: string;
  invoiceId: string;
  providerName: string;
  invoiceRef: string;
  description: string;
  amountMinor: number;
  currency: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  source: 'PROVIDER' | 'PATIENT' | 'GUEST';
  paidByMe: boolean;
  paidAt?: string;
  createdAt: string;
  failureReason?: string;
  refundStatus: 'NONE' | 'PENDING' | 'REFUNDED';
  refundedMinor: number;
  lines?: ApiTransactionLine[];
}

export interface StartedCharge {
  reference: string;
  // Null when a saved card was charged. There is no checkout page to open.
  authorizationUrl: string | null;
  amountMinor: number;
  status: string;
}

export async function startPatientCharge(input: {
  invoiceId: string;
  email?: string;
  amountMinor?: number;
  saveCard?: boolean;
  savedMethodId?: string;
}): Promise<StartedCharge> {
  return patientApiRequest<StartedCharge>('/patient/paystack/charges', { method: 'POST', body: input });
}

export async function fetchTransactions(): Promise<ApiTransaction[]> {
  const res = await patientApiRequest<ListResponse<ApiTransaction>>('/patient/transactions');
  return res.items;
}

export async function fetchTransaction(reference: string): Promise<ApiTransaction> {
  return patientApiRequest<ApiTransaction>(`/patient/transactions/${encodeURIComponent(reference)}`);
}

export async function claimGuestPayment(claimCode: string): Promise<ApiTransaction> {
  return patientApiRequest<ApiTransaction>('/patient/transactions/claim', { method: 'POST', body: { claimCode } });
}

// Payment reminders. Mirrors wellipay-api src/routes/patientReminders.ts.
export interface ApiReminderItem {
  invoiceId: string;
  invoiceRef: string;
  providerName: string;
  description: string;
  outstandingMinor: number;
  dueAt?: string;
  dueState: 'OVERDUE' | 'DUE_SOON' | 'OPEN';
  nextInstallment?: { dueAt: string; amountMinor: number };
  reminder?: { remindAt: string; note?: string; sent: boolean };
}

export async function fetchReminders(): Promise<ApiReminderItem[]> {
  const res = await patientApiRequest<ListResponse<ApiReminderItem>>('/patient/reminders');
  return res.items;
}

export async function setReminder(invoiceId: string, remindAt: Date, note?: string): Promise<void> {
  await patientApiRequest(`/patient/reminders/${encodeURIComponent(invoiceId)}`, {
    method: 'PUT',
    body: { remindAt: remindAt.toISOString(), ...(note ? { note } : {}) },
  });
}

export async function clearReminder(invoiceId: string): Promise<void> {
  await patientApiRequest(`/patient/reminders/${encodeURIComponent(invoiceId)}`, { method: 'DELETE' });
}

// Saved cards. Mirrors src/routes/patientCards.ts. The API never sends the card token.
export interface ApiSavedCard {
  methodId: string;
  brand: string;
  last4: string;
  expMonth?: string;
  expYear?: string;
  bank?: string;
  expired: boolean;
  createdAt: string;
}

export async function fetchSavedCards(): Promise<ApiSavedCard[]> {
  const res = await patientApiRequest<ListResponse<ApiSavedCard>>('/patient/payment-methods');
  return res.items;
}

export async function deleteSavedCard(methodId: string): Promise<void> {
  await patientApiRequest(`/patient/payment-methods/${encodeURIComponent(methodId)}`, { method: 'DELETE' });
}

// Wallet: prepaid credit with the provider. Mirrors src/routes/patientWallet.ts.
export interface ApiWalletEntry {
  entryId: string;
  kind: 'TOPUP' | 'INVOICE_PAYMENT';
  amountMinor: number;
  reference: string;
  invoiceId?: string;
  createdAt: string;
}

export interface ApiWallet {
  balanceMinor: number;
  currency: string;
  minTopUpMinor: number;
  maxTopUpMinor: number;
  providerName: string;
  entries: ApiWalletEntry[];
}

export async function fetchWallet(): Promise<ApiWallet> {
  return patientApiRequest<ApiWallet>('/patient/wallet');
}

export interface StartedTopUp {
  reference: string;
  authorizationUrl: string;
  amountMinor: number;
  status: string;
}

export async function startWalletTopUp(input: { amountMinor: number; email?: string }): Promise<StartedTopUp> {
  return patientApiRequest<StartedTopUp>('/patient/wallet/topups', { method: 'POST', body: input });
}

export interface ApiTopUp {
  reference: string;
  amountMinor: number;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  failureReason?: string;
  createdAt: string;
}

export async function fetchTopUp(reference: string): Promise<ApiTopUp> {
  return patientApiRequest<ApiTopUp>(`/patient/wallet/topups/${encodeURIComponent(reference)}`);
}

export interface WalletPayment {
  paymentId: string;
  reference: string;
  amountMinor: number;
  invoiceStatus: 'PAID' | 'PARTIALLY_PAID';
  balanceMinor: number;
}

export async function payFromWallet(input: { invoiceId: string; amountMinor?: number }): Promise<WalletPayment> {
  return patientApiRequest<WalletPayment>('/patient/wallet/pay', { method: 'POST', body: input });
}

// Pharmacy prescriptions, refills and order tracking. Mirrors wellipay-api src/routes/patientPharmacy.ts.
export type RxStatus = 'SUBMITTED' | 'VERIFIED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED';

export interface ApiPrescription {
  prescriptionId: string;
  status: RxStatus;
  prescriberName?: string;
  issuedOn?: string;
  notes?: string;
  rejectionReason?: string;
  validUntil?: string;
  refillsAllowed: number;
  refillOfId?: string;
  createdAt: string;
  items: { itemId: string; description: string; quantity: number; directions?: string }[];
  images?: { imageId: string; contentType: string; sizeBytes: number }[];
  canRefill: boolean;
  refillsRemaining?: number;
  refillBlockedReason?: string;
}

export interface NewPrescriptionInput {
  prescriberName: string;
  prescriberLicenceNo?: string;
  issuedOn?: string;
  notes?: string;
  items: { description: string; quantity: number; directions?: string }[];
}

export async function fetchPrescriptions(): Promise<ApiPrescription[]> {
  const res = await patientApiRequest<ListResponse<ApiPrescription>>('/patient/prescriptions');
  return res.items;
}

export async function submitPrescription(body: NewPrescriptionInput): Promise<ApiPrescription> {
  return patientApiRequest<ApiPrescription>('/patient/prescriptions', { method: 'POST', body });
}

// A photo of the paper prescription. The pharmacist compares it with the typed items.
export async function uploadPrescriptionPhoto(prescriptionId: string, photo: { contentType: 'image/jpeg'; dataBase64: string }): Promise<void> {
  await patientApiRequest(`/patient/prescriptions/${encodeURIComponent(prescriptionId)}/images`, { method: 'POST', body: photo });
}

export async function requestRefill(prescriptionId: string): Promise<void> {
  await patientApiRequest(`/patient/prescriptions/${encodeURIComponent(prescriptionId)}/refill`, { method: 'POST', body: {} });
}

export async function cancelPrescription(prescriptionId: string): Promise<void> {
  await patientApiRequest(`/patient/prescriptions/${encodeURIComponent(prescriptionId)}/cancel`, { method: 'POST', body: {} });
}

export interface ApiPharmacyOrder {
  orderId: string;
  invoiceId: string;
  status: 'AWAITING_DISPENSING' | 'DISPENSED' | 'CANCELLED';
  fulfilment: 'PICKUP' | 'DELIVERY';
  deliveryStatus: 'NOT_APPLICABLE' | 'PENDING' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'FAILED';
  deliveryFeeMinor: number;
  courierName?: string;
  dispatchedAt?: string;
  deliveredAt?: string;
  failureReason?: string;
  dispensedAt?: string;
  readyAt?: string;
  trackingUrl?: string;
  createdAt: string;
  proofCode?: string;
  lines: { description: string; quantity: number }[];
}

export async function fetchPharmacyOrders(): Promise<ApiPharmacyOrder[]> {
  const res = await patientApiRequest<ListResponse<ApiPharmacyOrder>>('/patient/pharmacy-orders');
  return res.items;
}

// Health-record connections (wellipay-api src/routes/recordConnections.ts).
// A connection is a reference plus a verification. It never gives anyone
// access to records, and the API says so in every response.
export type RecordConnectionKind = 'WELLIRECORD' | 'EXTERNAL_SYSTEM' | 'PROVIDER_PATIENT_NUMBER';

export interface ApiRecordIntegration {
  key: string;
  name: string;
  kind: RecordConnectionKind;
}

export interface ApiRecordConnection {
  id: string;
  kind: RecordConnectionKind;
  integrationKey?: string;
  integrationName?: string;
  reference: string;
  status: 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED' | 'REVOKED' | 'EXPIRED';
  nextStep: 'ENTER_CODE' | 'AWAIT_PROVIDER_REVIEW' | 'NONE';
  codeExpiresAt?: string;
  decisionNote?: string;
  verifiedAt?: string;
  createdAt: string;
  grantsRecordAccess: false;
  notice: string;
}

export async function fetchRecordIntegrations(): Promise<{ items: ApiRecordIntegration[]; notice: string }> {
  return patientApiRequest('/patient/record-integrations');
}

export async function fetchRecordConnections(): Promise<{ items: ApiRecordConnection[]; notice: string }> {
  return patientApiRequest('/patient/record-connections');
}

export async function createRecordConnection(input: {
  kind: RecordConnectionKind;
  integrationKey?: string;
  reference: string;
}): Promise<ApiRecordConnection> {
  return patientApiRequest('/patient/record-connections', { method: 'POST', body: input });
}

export async function confirmRecordConnection(id: string, code: string): Promise<ApiRecordConnection> {
  return patientApiRequest(`/patient/record-connections/${encodeURIComponent(id)}/confirm`, { method: 'POST', body: { code } });
}

export async function revokeRecordConnection(id: string): Promise<ApiRecordConnection> {
  return patientApiRequest(`/patient/record-connections/${encodeURIComponent(id)}/revoke`, { method: 'POST', body: {} });
}
