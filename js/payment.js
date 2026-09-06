/**
 * DHRUV E-MITRA SEVA KENDRA - RAZORPAY PAYMENT SYSTEM
 * Flow: User -> Select Service -> Enter Details -> Enter Amount -> Pay with Razorpay -> Verify Payment -> Generate Payment Receipt
 * 
 * Important Rules:
 * - Secret keys NEVER exposed in frontend code.
 * - Server-side verification via /api/verify-payment.
 * - Only after successful verification is receipt generated.
 * - If Razorpay credentials/backend are not configured, shows "Online payment will be available soon".
 * - No fake payment records or dummy transaction IDs.
 */

document.addEventListener('DOMContentLoaded', () => {
  initPaymentForm();
});

function initPaymentForm() {
  const serviceSelect = document.getElementById('payServiceSelect');
  if (!serviceSelect) return;

  // Populate services from catalog
  serviceSelect.innerHTML = '<option value="">-- सेवा चुनें / Select Service --</option>' + 
    SERVICE_PRICING.map(p => `
      <option value="${p.serviceId}" data-dept="${p.deptFee}" data-centre="${p.centreFee}" data-print="${p.printFee}" data-total="${p.total}">
        ${p.name} - ₹${p.total}
      </option>
    `).join('');

  // Handle URL query parameters if present
  const urlParams = new URLSearchParams(window.location.search);
  const preSelectedSvc = urlParams.get('service');
  const preRef = urlParams.get('ref');

  if (preSelectedSvc) serviceSelect.value = preSelectedSvc;
  if (preRef) {
    const refInput = document.getElementById('payRefNo');
    if (refInput) refInput.value = preRef;
  }

  updatePaymentBreakdown();
  serviceSelect.addEventListener('change', updatePaymentBreakdown);

  // Form submission
  const payForm = document.getElementById('paymentForm');
  if (payForm) {
    payForm.addEventListener('submit', handleRazorpayPayment);
  }
}

function updatePaymentBreakdown() {
  const serviceSelect = document.getElementById('payServiceSelect');
  const selectedOption = serviceSelect ? serviceSelect.options[serviceSelect.selectedIndex] : null;

  const deptFeeEl = document.getElementById('breakdownDeptFee');
  const centreFeeEl = document.getElementById('breakdownCentreFee');
  const printFeeEl = document.getElementById('breakdownPrintFee');
  const totalFeeEl = document.getElementById('breakdownTotalFee');
  const amountInput = document.getElementById('payAmount');
  const noteEl = document.getElementById('breakdownNote');

  if (!selectedOption || !selectedOption.value) {
    if (deptFeeEl) deptFeeEl.textContent = '₹0';
    if (centreFeeEl) centreFeeEl.textContent = '₹0';
    if (printFeeEl) printFeeEl.textContent = '₹0';
    if (totalFeeEl) totalFeeEl.textContent = '₹0';
    if (amountInput) amountInput.value = '';
    return;
  }

  const dept = parseFloat(selectedOption.getAttribute('data-dept')) || 0;
  const centre = parseFloat(selectedOption.getAttribute('data-centre')) || 0;
  const print = parseFloat(selectedOption.getAttribute('data-print')) || 0;
  const total = parseFloat(selectedOption.getAttribute('data-total')) || (dept + centre + print);

  if (deptFeeEl) deptFeeEl.textContent = `₹${dept}`;
  if (centreFeeEl) centreFeeEl.textContent = `₹${centre}`;
  if (printFeeEl) printFeeEl.textContent = `₹${print}`;
  if (totalFeeEl) totalFeeEl.textContent = `₹${total}`;
  if (amountInput) amountInput.value = total;

  const matched = SERVICE_PRICING.find(p => p.serviceId === selectedOption.value);
  if (noteEl && matched) {
    noteEl.textContent = `* ${matched.note}`;
  }
}

async function handleRazorpayPayment(e) {
  e.preventDefault();

  const name = document.getElementById('payName').value.trim();
  const mobile = document.getElementById('payMobile').value.trim();
  const email = document.getElementById('payEmail').value.trim() || `${mobile}@dhruvemitra.in`;
  const serviceSelect = document.getElementById('payServiceSelect');
  const serviceName = serviceSelect.options[serviceSelect.selectedIndex]?.text.split(' - ')[0] || 'Citizen Service';
  const refNo = document.getElementById('payRefNo').value.trim() || '';
  const amount = parseFloat(document.getElementById('payAmount').value);

  if (!name || !mobile || !amount || amount <= 0) {
    showToast('कृपया सभी आवश्यक विवरण सही भरें / Please fill all required fields', 'error');
    return;
  }

  if (!/^[6-9]\d{9}$/.test(mobile)) {
    showToast('कृपया 10 अंकों का वैध मोबाइल नंबर दर्ज करें / Enter valid 10-digit mobile', 'error');
    return;
  }

  const submitBtn = document.getElementById('paySubmitBtn');
  const statusMsgBox = document.getElementById('paymentStatusMessageBox');

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> भुगतान गेटवे कनेक्ट हो रहा है...`;
  }

  // Attempt backend order creation via serverless API
  try {
    const orderRes = await fetch('/api/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: amount,
        currency: 'INR',
        receipt: `rcpt_${Date.now()}`,
        notes: { customerName: name, mobile: mobile, service: serviceName, refNo: refNo }
      })
    });

    // If backend is not available or credentials missing
    if (!orderRes.ok) {
      throw new Error('API_UNAVAILABLE');
    }

    const orderData = await orderRes.json();

    if (!orderData || !orderData.id) {
      throw new Error('ORDER_CREATION_FAILED');
    }

    // Launch Razorpay Checkout with Order ID
    const options = {
      key: orderData.keyId || localStorage.getItem('dhruv_razorpay_key_id'),
      amount: orderData.amount,
      currency: orderData.currency || 'INR',
      name: DHRUV_CONFIG.centreNameEn,
      description: serviceName,
      order_id: orderData.id,
      prefill: {
        name: name,
        contact: mobile,
        email: email
      },
      theme: { color: '#0c3875' },
      handler: async function (response) {
        if (submitBtn) {
          submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> भुगतान सत्यापन प्रक्रियाधीन...`;
        }

        // Verify Razorpay payment server-side
        try {
          const verifyRes = await fetch('/api/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            })
          });

          const verifyData = await verifyRes.json();

          if (verifyRes.ok && verifyData.verified) {
            // Payment verified server-side! Generate official receipt
            const receiptCount = (getStoredReceipts() || []).length + 1;
            const verifiedReceiptNo = `DMSK-${new Date().getFullYear()}-${String(receiptCount).padStart(6, '0')}`;

            const verifiedReceipt = {
              receiptNo: verifiedReceiptNo,
              customerName: name,
              mobile: mobile,
              email: email,
              service: serviceName,
              refNo: refNo,
              amount: amount,
              date: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
              paymentMethod: 'Razorpay Online',
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              status: 'PAID'
            };

            saveReceipt(verifiedReceipt);
            showToast('भुगतान सफलतापूर्वक सत्यापित! रसीद तैयार हो रही है...', 'success');
            setTimeout(() => {
              window.location.href = `receipt.html?id=${verifiedReceiptNo}`;
            }, 800);
          } else {
            showToast('भुगतान सत्यापन विफल हुआ। कृपया केंद्र से संपर्क करें।', 'error');
            resetSubmitButton();
          }
        } catch (err) {
          showToast('सर्वर से सत्यापन में त्रुटि हुई।', 'error');
          resetSubmitButton();
        }
      },
      modal: {
        ondismiss: function () {
          resetSubmitButton();
          showToast('भुगतान रद्द किया गया / Payment cancelled', 'info');
        }
      }
    };

    const rzp = new Razorpay(options);
    rzp.on('payment.failed', function (resp) {
      showToast(`भुगतान विफल: ${resp.error.description}`, 'error');
      resetSubmitButton();
    });
    rzp.open();

  } catch (err) {
    // Truthful state when backend or credentials are not yet configured
    resetSubmitButton();
    displayPaymentUnavailableState(name, serviceName, amount);
  }
}

function resetSubmitButton() {
  const submitBtn = document.getElementById('paySubmitBtn');
  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.innerHTML = `<i class="fa-solid fa-lock"></i> सुरक्षित भुगतान करें / Pay with Razorpay`;
  }
}

function displayPaymentUnavailableState(name, serviceName, amount) {
  const msgBox = document.getElementById('paymentStatusMessageBox');
  if (!msgBox) return;

  msgBox.style.display = 'block';
  msgBox.innerHTML = `
    <div style="background:#fffbeb;border:1.5px solid #fde68a;border-radius:12px;padding:24px;text-align:center;">
      <div style="width:50px;height:50px;background:#fef3c7;color:#b45309;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:22px;margin:0 auto 12px;">
        <i class="fa-solid fa-clock-rotate-left"></i>
      </div>
      <h3 style="font-size:18px;font-weight:800;color:#92400e;margin-bottom:8px;">
        ऑनलाइन भुगतान सुविधा शीघ्र उपलब्ध होगी
      </h3>
      <p style="font-size:13px;color:#78350f;max-width:540px;margin:0 auto 16px;line-height:1.6;">
        <strong>Online payment will be available soon.</strong><br>
        रेज़रपे पेमेंट गेटवे बैकएंड एकीकरण वर्तमान में अद्यतन हो रहा है। सेवा <strong>"${serviceName}"</strong> (राशि: ₹${amount}) के भुगतान अथवा आवेदन हेतु कृपया सीधे ध्रुव ई-मित्र सेवा केंद्र से संपर्क करें।
      </p>
      <div style="display:flex;justify-content:center;gap:12px;flex-wrap:wrap;">
        <a href="https://wa.me/${DHRUV_CONFIG.whatsapp}?text=${encodeURIComponent(`नमस्ते, मुझे "${serviceName}" (₹${amount}) के भुगतान/आवेदन हेतु सहायता चाहिए।`)}" target="_blank" class="btn btn-success btn-sm">
          <i class="fa-brands fa-whatsapp"></i> व्हाट्सएप पर संपर्क करें
        </a>
        <a href="tel:${DHRUV_CONFIG.phoneRaw}" class="btn btn-primary btn-sm">
          <i class="fa-solid fa-phone"></i> कॉल करें: ${DHRUV_CONFIG.phone}
        </a>
      </div>
    </div>
  `;

  msgBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
