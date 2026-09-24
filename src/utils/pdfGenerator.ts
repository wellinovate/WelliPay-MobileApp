import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { NAIRA, fmtDate, timeNow } from './helpers';

export interface ReceiptData {
  ref: string;
  facility: string;
  personName: string;
  amountPaid: number;
  remainingBalance?: number;
  method: string;
  date?: string;
  time?: string;
  billNo?: string;
  hmoProvider?: string;
  hmoCovered?: number;
  patientSelfPay?: number;
  totalHealthcareCost?: number;
  depositPaid?: number;
  depositApplied?: number;
  refundCredit?: number;
  hmoVariance?: number;
  payerAllocations?: Array<{ payerName: string; amount: number; status: string }>;
}

export const generateReceiptPdf = async (data: ReceiptData): Promise<string> => {
  const dateStr = data.date || fmtDate(new Date());
  const timeStr = data.time || timeNow();

  const totalCost = data.totalHealthcareCost || (data.amountPaid + (data.hmoCovered || 0) + (data.remainingBalance || 0));
  const psp = data.patientSelfPay !== undefined ? data.patientSelfPay : (data.amountPaid + (data.remainingBalance || 0));

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>WelliPay Patient Responsibility Statement - ${data.ref}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 36px;
      color: #1A1A18;
      background-color: #FFFFFF;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #1B5E6B;
      padding-bottom: 18px;
      margin-bottom: 20px;
    }
    .brand {
      font-size: 26px;
      font-weight: 800;
      color: #1B5E6B;
      letter-spacing: -0.5px;
    }
    .brand-sub {
      font-size: 12px;
      color: #5A5A56;
      margin-top: 3px;
      font-weight: 600;
    }
    .tagline {
      font-size: 11px;
      color: #1B5E6B;
      font-style: italic;
      margin-top: 2px;
    }
    .badge-doc {
      background-color: #E8F4F7;
      color: #0E3D49;
      font-weight: 700;
      font-size: 12px;
      padding: 6px 14px;
      border-radius: 20px;
      border: 1px solid #B8D9E0;
      text-transform: uppercase;
      text-align: right;
    }
    .doc-title {
      font-size: 18px;
      font-weight: 800;
      color: #1A1A18;
      margin-bottom: 16px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .grid-summary {
      display: flex;
      gap: 12px;
      margin-bottom: 24px;
    }
    .summary-box {
      flex: 1;
      background-color: #FAFAF8;
      border: 1px solid #E4E4E0;
      border-radius: 8px;
      padding: 14px;
      text-align: center;
    }
    .summary-box.highlight {
      background-color: #E8F4F7;
      border-color: #B8D9E0;
    }
    .box-label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #5A5A56;
      margin-bottom: 4px;
    }
    .box-val {
      font-size: 20px;
      font-weight: 800;
      color: #1A1A18;
    }
    .box-val.teal { color: #1B5E6B; }
    .box-val.danger { color: #C0392B; }
    .details-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
    }
    .details-table th {
      background-color: #FAFAF8;
      padding: 10px 8px;
      font-size: 11px;
      text-transform: uppercase;
      color: #5A5A56;
      border-bottom: 1px solid #E4E4E0;
      text-align: left;
    }
    .details-table td {
      padding: 10px 8px;
      font-size: 13px;
      border-bottom: 1px solid #E4E4E0;
    }
    .details-table td.label {
      color: #5A5A56;
      width: 45%;
    }
    .details-table td.val {
      font-weight: 600;
      color: #1A1A18;
      text-align: right;
    }
    .reconcile-box {
      background-color: #F8F9F9;
      border-left: 4px solid #1B5E6B;
      padding: 14px;
      border-radius: 4px;
      font-size: 12px;
      color: #5A5A56;
      line-height: 1.6;
      margin-bottom: 24px;
    }
    .footer {
      border-top: 1px solid #E4E4E0;
      padding-top: 16px;
      font-size: 10px;
      color: #9A9A95;
      text-align: center;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">WelliPay™</div>
      <div class="tagline">One bill, every payer.</div>
      <div class="brand-sub">Healthcare Clearing & Settlement Network</div>
    </div>
    <div class="badge-doc">
      ${data.remainingBalance && data.remainingBalance > 0 ? 'Balance Outstanding' : '✓ Fully Settled'}
    </div>
  </div>

  <div class="doc-title">Patient Responsibility Statement (PRS)</div>

  <div class="grid-summary">
    <div class="summary-box">
      <div class="box-label">Total Healthcare Cost</div>
      <div class="box-val">${NAIRA(totalCost)}</div>
    </div>
    <div class="summary-box highlight">
      <div class="box-label">HMO Cover</div>
      <div class="box-val teal">-${NAIRA(data.hmoCovered || 0)}</div>
    </div>
    <div class="summary-box">
      <div class="box-label">Patient Self-Pay (PSP)</div>
      <div class="box-val">${NAIRA(psp)}</div>
    </div>
    <div class="summary-box">
      <div class="box-label">Balance Due</div>
      <div class="box-val ${data.remainingBalance && data.remainingBalance > 0 ? 'danger' : 'teal'}">
        ${NAIRA(data.remainingBalance || 0)}
      </div>
    </div>
  </div>

  <table class="details-table">
    <tr>
      <td class="label">Statement / Reference No.</td>
      <td class="val">${data.ref}</td>
    </tr>
    <tr>
      <td class="label">Hospital / Healthcare Facility</td>
      <td class="val">${data.facility}</td>
    </tr>
    ${data.billNo ? `<tr><td class="label">Hospital Bill / Encounter ID</td><td class="val">${data.billNo}</td></tr>` : ''}
    <tr>
      <td class="label">Patient Enrollee Name</td>
      <td class="val">${data.personName}</td>
    </tr>
    <tr>
      <td class="label">Statement Date & Time</td>
      <td class="val">${dateStr} at ${timeStr}</td>
    </tr>
    <tr>
      <td class="label">Primary Payer (HMO / Insurance)</td>
      <td class="val">${data.hmoProvider || 'Self-Funded'} (${NAIRA(data.hmoCovered || 0)} Adjudicated)</td>
    </tr>
    ${data.depositApplied && data.depositApplied > 0 ? `
    <tr>
      <td class="label">Pre-Service Deposit Applied</td>
      <td class="val">-${NAIRA(data.depositApplied)}</td>
    </tr>` : ''}
    <tr>
      <td class="label">Confirmed Patient Self-Pay (PSP)</td>
      <td class="val">${NAIRA(psp)}</td>
    </tr>
    <tr>
      <td class="label">Patient Amount Paid to Date</td>
      <td class="val">${NAIRA(data.amountPaid)} (${data.method.toUpperCase()})</td>
    </tr>
    <tr>
      <td class="label"><strong>Net Outstanding Due</strong></td>
      <td class="val" style="color: ${data.remainingBalance && data.remainingBalance > 0 ? '#C0392B' : '#1B5E6B'}; font-size: 15px;">
        <strong>${NAIRA(data.remainingBalance || 0)}</strong>
      </td>
    </tr>
  </table>

  <div class="reconcile-box">
    <strong>WelliPay Reconcile™ Audit Trail:</strong>
    This Patient Responsibility Statement reflects confirmed payer allocations adjudicated under accredited hospital tariff schedules. 
    ${data.hmoVariance && data.hmoVariance > 0 ? `<br/><span style="color:#C0392B; font-weight:700;">⚠ Variance Note:</span> An HMO remittance variance of ₦${data.hmoVariance.toLocaleString()} has been flagged as an underpayment receivable.` : '<br/>✓ Primary insurer and patient allocations are verified.'}
  </div>

  <div class="footer">
    WelliPay Technologies Ltd · Licensed Healthcare FinTech Partner · RC 1892014<br/>
    Support: support@wellipay.ng · 0800 111 2222 · Lagos, Nigeria
  </div>
</body>
</html>
`;

  const { uri } = await Print.printToFileAsync({ html });
  return uri;
};

export const shareReceiptPdf = async (pdfUri: string) => {
  const isAvailable = await Sharing.isAvailableAsync();
  if (isAvailable) {
    await Sharing.shareAsync(pdfUri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Share WelliPay Patient Responsibility Statement',
      UTI: 'com.adobe.pdf',
    });
  } else {
    throw new Error('Sharing is not available on this device');
  }
};
