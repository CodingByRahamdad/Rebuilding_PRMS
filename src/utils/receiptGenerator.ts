export interface ReceiptData {
  invoiceNumber: string;
  patientName: string;
  patientId?: string;
  patientAddress?: string;
  patientPhone?: string;
  date: string;
  serviceType: string;
  totalAmount: number;
  paidAmount: number;
  dueAmount?: number;
  paymentMethod: string;
  status: 'Paid' | 'Pending' | 'Partial' | 'Insurance Claim' | 'Completed' | 'Refunded';
  insuranceProvider?: string;
  claimId?: string;
  partialReason?: string;
  nextPaymentDate?: string;
  attendingDoctor?: string;
  department?: string;
  issuedBy?: string;
}

export function generateAndPrintReceipt(data: ReceiptData) {
  const total = Number(data.totalAmount) || 0;
  const paid = Number(data.paidAmount) || 0;
  const due = data.dueAmount !== undefined ? data.dueAmount : Math.max(0, total - paid);

  const receiptHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Payment Receipt - ${data.invoiceNumber}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    
    body {
      background-color: #f8fafc;
      color: #1e293b;
      padding: 40px 20px;
      font-size: 13px;
    }

    .receipt-container {
      max-width: 680px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 36px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
    }

    .receipt-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0f766e;
      padding-bottom: 20px;
      margin-bottom: 24px;
    }

    .brand-title {
      font-size: 20px;
      font-weight: 800;
      color: #0f766e;
      letter-spacing: -0.5px;
    }

    .brand-sub {
      font-size: 11px;
      color: #64748b;
      margin-top: 2px;
    }

    .receipt-badge {
      text-align: right;
    }

    .receipt-type {
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .invoice-no {
      font-family: monospace;
      font-weight: 700;
      color: #0f766e;
      font-size: 13px;
      margin-top: 3px;
    }

    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      background: #f8fafc;
      border: 1px solid #edf2f7;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 24px;
    }

    .meta-col p {
      margin-bottom: 6px;
      color: #475569;
    }

    .meta-col p strong {
      color: #0f172a;
    }

    .table-container {
      margin-bottom: 24px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }

    th {
      background: #f1f5f9;
      color: #334155;
      font-weight: 700;
      padding: 10px 14px;
      font-size: 12px;
      border-radius: 6px;
    }

    td {
      padding: 12px 14px;
      border-bottom: 1px solid #f1f5f9;
      color: #1e293b;
    }

    .amount-col {
      text-align: right;
      font-variant-numeric: tabular-nums;
    }

    .totals-box {
      margin-left: auto;
      width: 280px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 14px;
      margin-bottom: 24px;
    }

    .totals-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 6px;
      color: #475569;
    }

    .totals-row.final {
      border-top: 1px dashed #cbd5e1;
      padding-top: 8px;
      margin-top: 6px;
      font-weight: 800;
      font-size: 15px;
      color: #0f172a;
    }

    .badge-status {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
    }

    .status-Paid, .status-Completed {
      background: #dcfce7;
      color: #15803d;
    }

    .status-Partial {
      background: #fef3c7;
      color: #b45309;
    }

    .status-Pending {
      background: #fee2e2;
      color: #b91c1c;
    }

    .partial-alert {
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 8px;
      padding: 12px 16px;
      margin-bottom: 24px;
      color: #92400e;
      font-size: 12px;
    }

    .receipt-footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: #94a3b8;
      font-size: 11px;
    }

    .signature-area {
      text-align: center;
      width: 180px;
      border-top: 1px solid #cbd5e1;
      padding-top: 6px;
      color: #64748b;
      margin-top: 30px;
    }

    @media print {
      body {
        background: #ffffff;
        padding: 0;
      }
      .receipt-container {
        border: none;
        box-shadow: none;
        padding: 20px;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="receipt-container">
    <div class="receipt-header">
      <div>
        <div class="brand-title">PULSE CARE HOSPITAL</div>
        <div class="brand-sub">Medical Center & Comprehensive Health Systems</div>
        <div class="brand-sub">742 Evergreen Health Blvd, Suite 400 • Tel: +1 (555) 019-2831</div>
      </div>
      <div class="receipt-badge">
        <div class="receipt-type">Official Receipt</div>
        <div class="invoice-no">${data.invoiceNumber}</div>
        <div style="margin-top: 4px;">
          <span class="badge-status status-${data.status}">${data.status}</span>
        </div>
      </div>
    </div>

    <div class="meta-grid">
      <div class="meta-col">
        <p><strong>Patient Name:</strong> ${data.patientName}</p>
        ${data.patientId ? `<p><strong>Patient ID / Code:</strong> ${data.patientId}</p>` : ''}
        ${data.patientPhone ? `<p><strong>Phone:</strong> ${data.patientPhone}</p>` : ''}
        ${data.patientAddress ? `<p><strong>Address:</strong> ${data.patientAddress}</p>` : ''}
      </div>
      <div class="meta-col">
        <p><strong>Receipt Date:</strong> ${data.date}</p>
        <p><strong>Payment Method:</strong> ${data.paymentMethod}</p>
        ${data.attendingDoctor ? `<p><strong>Attending Doctor:</strong> ${data.attendingDoctor}</p>` : ''}
        ${data.department ? `<p><strong>Department:</strong> ${data.department}</p>` : ''}
        ${data.insuranceProvider ? `<p><strong>Insurance:</strong> ${data.insuranceProvider}</p>` : ''}
        ${data.claimId ? `<p><strong>Claim Ref ID:</strong> ${data.claimId}</p>` : ''}
      </div>
    </div>

    ${data.status === 'Partial' || data.partialReason || data.nextPaymentDate ? `
      <div class="partial-alert">
        <div style="font-weight: 700; margin-bottom: 2px;">⚠️ Partial Payment Notice</div>
        ${data.partialReason ? `<div><strong>Reason:</strong> ${data.partialReason}</div>` : ''}
        ${data.nextPaymentDate ? `<div><strong>Next Installment Due Date:</strong> ${data.nextPaymentDate}</div>` : ''}
      </div>
    ` : ''}

    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Description / Medical Service</th>
            <th class="amount-col">Total Billed</th>
            <th class="amount-col">Amount Paid</th>
            <th class="amount-col">Balance Due</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>${data.serviceType}</strong>
              <div style="color: #64748b; font-size: 11px; margin-top: 2px;">Clinical consultation, diagnostics & administrative processing</div>
            </td>
            <td class="amount-col">$${total.toFixed(2)}</td>
            <td class="amount-col" style="color: #15803d; font-weight: 600;">$${paid.toFixed(2)}</td>
            <td class="amount-col" style="color: ${due > 0 ? '#b45309' : '#64748b'}; font-weight: 600;">$${due.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="totals-box">
      <div class="totals-row">
        <span>Total Billed:</span>
        <strong>$${total.toFixed(2)}</strong>
      </div>
      <div class="totals-row">
        <span>Amount Tendered:</span>
        <strong style="color: #15803d;">$${paid.toFixed(2)}</strong>
      </div>
      <div class="totals-row final">
        <span>Outstanding Balance:</span>
        <span style="color: ${due > 0 ? '#b45309' : '#0f172a'};">$${due.toFixed(2)}</span>
      </div>
    </div>

    <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 30px;">
      <div style="font-size: 11px; color: #64748b; line-height: 1.5;">
        Thank you for choosing Pulse Care Medical Center.<br>
        Computer-generated electronic healthcare receipt.<br>
        Issued By: ${data.issuedBy || 'Hospital Cashier / Billing Desk'}
      </div>
      <div class="signature-area">
        Authorized Signature
      </div>
    </div>

    <div class="receipt-footer" style="margin-top: 30px;">
      <span>Receipt Token: SEC-REC-${Math.random().toString(36).substring(2, 9).toUpperCase()}</span>
      <span>Printed: ${new Date().toLocaleString()}</span>
    </div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 300);
    };
  </script>
</body>
</html>
  `;

  const printWindow = window.open('', '_blank', 'width=800,height=900');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(receiptHtml);
    printWindow.document.close();
  } else {
    // Fallback for popup blocking in sandbox iframe: create download blob
    const blob = new Blob([receiptHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Receipt_${data.invoiceNumber}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
