/**
 * DHRUV E-MITRA SEVA KENDRA - DIGITAL RECEIPT & INVOICE SYSTEM
 * Handles receipt lookup, A4 rendering, PDF download/print, WhatsApp receipt sharing.
 */

document.addEventListener('DOMContentLoaded', () => {
  initReceiptView();
});

function initReceiptView() {
  const urlParams = new URLSearchParams(window.location.search);
  const receiptId = urlParams.get('id');

  const lookupForm = document.getElementById('receiptLookupForm');
  if (lookupForm) {
    lookupForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const inputVal = document.getElementById('receiptLookupInput').value.trim().toUpperCase();
      if (!inputVal) {
        showToast('कृपया रसीद संख्या दर्ज करें / Enter Receipt Number', 'error');
        return;
      }
      displayReceiptById(inputVal);
    });
  }

  if (receiptId) {
    displayReceiptById(receiptId.toUpperCase());
  }
}

function displayReceiptById(receiptNo) {
  const receipts = getStoredReceipts();
  const receipt = receipts.find(r => r.receiptNo.toUpperCase() === receiptNo || (r.refNo && r.refNo.toUpperCase() === receiptNo));

  const resultContainer = document.getElementById('receiptDisplayArea');
  const emptyState = document.getElementById('receiptEmptyState');

  if (!receipt) {
    if (resultContainer) resultContainer.style.display = 'none';
    if (emptyState) {
      emptyState.style.display = 'block';
      emptyState.innerHTML = `
        <div style="text-align:center;padding:40px;background:#fff;border-radius:12px;border:1.5px dashed #cbd5e1;">
          <i class="fa-solid fa-file-circle-xmark" style="font-size:44px;color:var(--gov-red);margin-bottom:14px;"></i>
          <h3 style="color:var(--gov-blue-dark);margin-bottom:6px;">रसीद नहीं मिली / Receipt Not Found</h3>
          <p style="color:var(--text-muted);font-size:14px;max-width:400px;margin:0 auto 16px;">रसीद संख्या <strong>"${receiptNo}"</strong> से कोई रिकॉर्ड उपलब्ध नहीं है। कृपया सही नंबर जांचें या केंद्र से संपर्क करें।</p>
          <a href="https://wa.me/${DHRUV_CONFIG.whatsapp}" target="_blank" class="btn btn-outline btn-sm">
            <i class="fa-brands fa-whatsapp" style="color:#25d366"></i> व्हाट्सएप पर सहायता लें
          </a>
        </div>
      `;
    }
    return;
  }

  if (emptyState) emptyState.style.display = 'none';
  if (resultContainer) {
    resultContainer.style.display = 'block';
    renderReceiptHTML(receipt, resultContainer);
  }
}

function renderReceiptHTML(r, container) {
  const verifyUrl = encodeURIComponent(window.location.origin + window.location.pathname + `?id=${r.receiptNo}`);
  const qrApi = `https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${verifyUrl}`;

  container.innerHTML = `
    <div class="receipt-card print-page" id="receiptPrintArea">
      <!-- Watermark Background -->
      <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-30deg);font-size:75px;font-weight:900;color:rgba(12,56,117,0.03);pointer-events:none;white-space:nowrap;user-select:none;">
        DHRUV E-MITRA
      </div>

      <!-- Receipt Top Header -->
      <div class="receipt-header">
        <div>
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px;">
            <div style="width:36px;height:36px;background:var(--gov-blue-primary);color:#fff;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:18px;">
              <i class="fa-solid fa-landmark"></i>
            </div>
            <div>
              <h2 style="font-size:20px;color:var(--gov-blue-dark);font-weight:800;margin:0;">${DHRUV_CONFIG.centreNameEn}</h2>
              <div style="font-size:13px;color:var(--gov-saffron);font-weight:700;">${DHRUV_CONFIG.centreNameHi}</div>
            </div>
          </div>
          <p style="font-size:12px;color:var(--text-muted);margin-top:4px;">
            <i class="fa-solid fa-location-dot"></i> ${DHRUV_CONFIG.address}<br>
            <i class="fa-solid fa-phone"></i> ${DHRUV_CONFIG.phone} &nbsp;|&nbsp; <i class="fa-solid fa-envelope"></i> ${DHRUV_CONFIG.email}
          </p>
        </div>

        <div style="text-align:right;">
          <div class="receipt-stamp-paid">
            <i class="fa-solid fa-circle-check"></i> PAID
          </div>
          <div style="font-size:11px;color:var(--text-subtle);margin-top:8px;">
            DIGITAL TAX INVOICE / RECEIPT
          </div>
        </div>
      </div>

      <!-- Receipt Meta Info Grid -->
      <div class="receipt-meta-grid">
        <div class="meta-block">
          <h5>रसीद संख्या / Receipt No</h5>
          <p style="color:var(--gov-blue-primary);font-size:16px;">${r.receiptNo}</p>
        </div>
        <div class="meta-block" style="text-align:right;">
          <h5>दिनांक व समय / Payment Date & Time</h5>
          <p>${r.date}</p>
        </div>
        <div class="meta-block">
          <h5>ग्राहक का नाम / Customer Name</h5>
          <p>${r.customerName}</p>
          <div style="font-size:12px;color:var(--text-subtle);">मो: ${r.mobile}</div>
        </div>
        <div class="meta-block" style="text-align:right;">
          <h5>सेवा का नाम / Service</h5>
          <p>${r.service}</p>
          ${r.refNo ? `<div style="font-size:12px;color:var(--text-subtle);">Ref No: ${r.refNo}</div>` : ''}
        </div>
        <div class="meta-block">
          <h5>Razorpay Payment ID</h5>
          <p style="font-family:monospace;font-size:13px;">${r.razorpayPaymentId || '-'}</p>
        </div>
        <div class="meta-block" style="text-align:right;">
          <h5>Razorpay Order ID</h5>
          <p style="font-family:monospace;font-size:13px;">${r.razorpayOrderId || '-'}</p>
        </div>
      </div>

      <!-- Line Item Details Table -->
      <table class="receipt-item-table">
        <thead>
          <tr>
            <th style="width:40px;">#</th>
            <th>सेवा विवरण / Description</th>
            <th style="text-align:right;">सरकारी शुल्क / Govt Fee</th>
            <th style="text-align:right;">केंद्र शुल्क / Centre Fee</th>
            <th style="text-align:right;">कुल / Total</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1</td>
            <td>
              <strong>${r.service}</strong>
              <div style="font-size:12px;color:var(--text-muted);">Verified online payment via Razorpay Payment Gateway</div>
            </td>
            <td style="text-align:right;">₹${r.deptFee || 0}</td>
            <td style="text-align:right;">₹${(r.centreFee || 0) + (r.printFee || 0)}</td>
            <td style="text-align:right;font-weight:700;">₹${r.amount}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr style="background:#f8fafc;font-weight:800;">
            <td colspan="4" style="text-align:right;font-size:15px;color:var(--gov-blue-dark);padding:14px;">
              कुल प्राप्त राशि / Total Paid:
            </td>
            <td style="text-align:right;font-size:18px;color:var(--gov-green);padding:14px;">
              ₹${r.amount}.00
            </td>
          </tr>
        </tfoot>
      </table>

      <!-- Bottom Signature & QR Verification -->
      <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:20px;padding-top:16px;border-top:1px dashed var(--border-color);">
        <div style="display:flex;align-items:center;gap:14px;">
          <img src="${qrApi}" alt="Receipt QR" style="width:75px;height:75px;border:1px solid #cbd5e1;padding:3px;border-radius:6px;background:#fff;" onerror="this.style.display='none'">
          <div style="font-size:11px;color:var(--text-subtle);line-height:1.4;">
            <strong>डिजिटल सत्यापन / Digital QR:</strong><br>
            स्कैन कर रसीद की प्रमाणिकता जांचें।<br>
            Payment ID: <span style="font-family:monospace;font-size:10px;">${r.razorpayPaymentId || '-'}</span>
          </div>
        </div>

        <div style="text-align:right;">
          <div style="font-size:12px;font-weight:700;color:var(--gov-blue-dark);margin-bottom:28px;">
            अधिकृत हस्ताक्षरकर्ता / Authorized Signatory
          </div>
          <div style="font-size:13px;font-weight:800;color:var(--gov-blue-primary);">
            Dhruv E-Mitra Seva Kendra
          </div>
        </div>
      </div>

      <!-- Legal Disclaimer -->
      <div style="margin-top:20px;font-size:10.5px;color:var(--text-subtle);text-align:center;border-top:1px solid #f1f5f9;padding-top:10px;">
        यह ध्रुव ई-मित्र सेवा केंद्र (बृज नगर, भरतपुर) द्वारा जारी डिजिटल कर रसीद है। सरकारी शुल्क विभागीय नियमों के अनुसार लागू हैं।
      </div>
    </div>

    <!-- Action Toolbar (Hidden during Print) -->
    <div class="receipt-actions-toolbar no-print">
      <button onclick="window.print()" class="btn btn-primary">
        <i class="fa-solid fa-print"></i> रसीद प्रिंट करें / Print (A4)
      </button>
      <button onclick="shareReceiptWhatsApp('${r.receiptNo}', '${r.customerName}', '${r.service}', '${r.amount}')" class="btn btn-success">
        <i class="fa-brands fa-whatsapp"></i> व्हाट्सएप पर भेजें / WhatsApp
      </button>
      <a href="payment.html" class="btn btn-outline">
        <i class="fa-solid fa-arrow-left"></i> नया भुगतान करें / New Payment
      </a>
    </div>
  `;
}

function shareReceiptWhatsApp(receiptNo, name, service, amount) {
  const url = window.location.origin + window.location.pathname + `?id=${receiptNo}`;
  const text = encodeURIComponent(
    `*ध्रुव ई-मित्र सेवा केंद्र - भुगतान रसीद*\n` +
    `--------------------------------\n` +
    `रसीद संख्या: ${receiptNo}\n` +
    `नाम: ${name}\n` +
    `सेवा: ${service}\n` +
    `कुल राशि: ₹${amount} (PAID)\n` +
    `रसीद डाउनलोड लिंक: ${url}\n` +
    `--------------------------------\n` +
    `धन्यवाद! ध्रुव ई-मित्र सेवा केंद्र, बृज नगर, भरतपुर, राजस्थान`
  );
  window.open(`https://wa.me/?text=${text}`, '_blank');
}
