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
}

export const generateReceiptPdf = async (data: ReceiptData): Promise<string> => {
  const dateStr = data.date || fmtDate(new Date());
  const timeStr = data.time || timeNow();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>WelliPay Receipt - ${data.ref}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 40px;
      color: #1A1A18;
      background-color: #FFFFFF;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #1B5E6B;
      padding-bottom: 20px;
      margin-bottom: 24px;
    }
    .brand {
      font-size: 28px;
      font-weight: 800;
      color: #1B5E6B;
      letter-spacing: -0.5px;
    }
    .brand-sub {
      font-size: 12px;
      color: #5A5A56;
      margin-top: 4px;
    }
    .badge-paid {
      background-color: #E8F4F7;
      color: #0E3D49;
      font-weight: 700;
      font-size: 14px;
      padding: 8px 16px;
      border-radius: 20px;
      border: 1px solid #B8D9E0;
      text-transform: uppercase;
    }
    .amount-card {
      background-color: #FAFAF8;
      border: 1px solid #E4E4E0;
      border-radius: 12px;
      padding: 24px;
      text-align: center;
      margin-bottom: 30px;
    }
    .amount-label {
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #5A5A56;
      margin-bottom: 6px;
    }
    .amount-val {
      font-size: 36px;
      font-weight: 800;
      color: #1B5E6B;
    }
    .details-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    .details-table tr {
      border-bottom: 1px solid #E4E4E0;
    }
    .details-table td {
      padding: 12px 6px;
      font-size: 14px;
    }
    .details-table td.label {
      color: #5A5A56;
      width: 40%;
    }
    .details-table td.val {
      font-weight: 600;
      color: #1A1A18;
      text-align: right;
    }
    .security-stamp {
      background-color: #F8F9F9;
      border-left: 4px solid #1B5E6B;
      padding: 16px;
      border-radius: 4px;
      font-size: 12px;
      color: #5A5A56;
      line-height: 1.6;
      margin-bottom: 30px;
    }
    .footer {
      border-top: 1px solid #E4E4E0;
      padding-top: 20px;
      font-size: 11px;
      color: #9A9A95;
      text-align: center;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">WelliPay</div>
      <div class="brand-sub">Healthcare Payments Verified</div>
    </div>
    <div class="badge-paid">✓ Paid in Full</div>
  </div>

  <div class="amount-card">
    <div class="amount-label">Amount Cleared</div>
    <div class="amount-val">${NAIRA(data.amountPaid)}</div>
  </div>

  <table class="details-table">
    <tr>
      <td class="label">Transaction Reference</td>
      <td class="val">${data.ref}</td>
    </tr>
    <tr>
      <td class="label">Hospital / Healthcare Facility</td>
      <td class="val">${data.facility}</td>
    </tr>
    ${data.billNo ? `<tr><td class="label">Hospital Bill Number</td><td class="val">${data.billNo}</td></tr>` : ''}
    <tr>
      <td class="label">Patient Name</td>
      <td class="val">${data.personName}</td>
    </tr>
    <tr>
      <td class="label">Date & Time</td>
      <td class="val">${dateStr} at ${timeStr}</td>
    </tr>
    <tr>
      <td class="label">Payment Channel</td>
      <td class="val">${data.method.toUpperCase()}</td>
    </tr>
    ${data.hmoProvider ? `
    <tr>
      <td class="label">HMO Insurance Coverage</td>
      <td class="val">${data.hmoProvider} (${NAIRA(data.hmoCovered || 0)} Covered)</td>
    </tr>` : ''}
    ${data.remainingBalance && data.remainingBalance > 0 ? `
    <tr>
      <td class="label">Remaining Balance Due</td>
      <td class="val">${NAIRA(data.remainingBalance)}</td>
    </tr>` : ''}
  </table>

  <div class="security-stamp">
    <strong>✓ Certified Medical Settlement:</strong> This transaction was routed through WelliPay's regulated clearing rails directly to ${data.facility}. Valid as official proof of payment for patient admission, hospital discharge, and health insurance claims.
  </div>

  <div class="footer">
    WelliPay Technologies Ltd · RC 1892014<br/>
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
      dialogTitle: 'Share WelliPay Receipt',
      UTI: 'com.adobe.pdf',
    });
  } else {
    throw new Error('Sharing is not available on this device');
  }
};
