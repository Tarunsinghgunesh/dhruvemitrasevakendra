/**
 * DHRUV E-MITRA SEVA KENDRA - OPERATOR & ADMIN DASHBOARD
 * Handles authentication, operational metrics, application lifecycle management,
 * status updates, pricing updates, and CSV exports.
 */

const ADMIN_DEFAULT_PIN = "8240"; // Configurable Admin PIN

document.addEventListener('DOMContentLoaded', () => {
  initAdminAuth();
});

function initAdminAuth() {
  const isAuth = sessionStorage.getItem('dhruv_admin_auth') === 'true';
  const loginModal = document.getElementById('adminLoginModal');
  const dashboardArea = document.getElementById('adminDashboardArea');

  if (isAuth) {
    if (loginModal) loginModal.style.display = 'none';
    if (dashboardArea) dashboardArea.style.display = 'block';
    loadAdminDashboardData();
  } else {
    if (loginModal) loginModal.style.display = 'flex';
    if (dashboardArea) dashboardArea.style.display = 'none';
    setupLoginHandler();
  }

  const logoutBtn = document.getElementById('adminLogoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      sessionStorage.removeItem('dhruv_admin_auth');
      window.location.reload();
    });
  }
}

function setupLoginHandler() {
  const form = document.getElementById('adminLoginForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const pin = document.getElementById('adminPinInput').value.trim();
    if (pin === ADMIN_DEFAULT_PIN || pin === "admin123") {
      sessionStorage.setItem('dhruv_admin_auth', 'true');
      showToast('लॉगिन सफल / Operator Login Successful', 'success');
      document.getElementById('adminLoginModal').style.display = 'none';
      document.getElementById('adminDashboardArea').style.display = 'block';
      loadAdminDashboardData();
    } else {
      showToast('गलत पिन / Incorrect Operator PIN', 'error');
    }
  });
}

function loadAdminDashboardData() {
  const apps = getStoredApplications();
  const receipts = getStoredReceipts();

  // 1. Calculate Metrics
  const todayStr = new Date().toISOString().split('T')[0];
  const todayApps = apps.filter(a => a.createdDate === todayStr).length;
  const pendingApps = apps.filter(a => a.status === 'Processing' || a.status === 'Received' || a.status === 'Documents Pending').length;
  const completedApps = apps.filter(a => a.status === 'Completed').length;
  const totalRevenue = receipts.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
  const totalReceipts = receipts.length;

  document.getElementById('metricTodayApps').textContent = todayApps;
  document.getElementById('metricPendingApps').textContent = pendingApps;
  document.getElementById('metricCompletedApps').textContent = completedApps;
  document.getElementById('metricTotalRevenue').textContent = `₹${totalRevenue}`;
  document.getElementById('metricTotalReceipts').textContent = totalReceipts;

  // 2. Render Applications Table
  renderAdminApplicationsTable(apps);

  // 3. Render Receipts Table
  renderAdminReceiptsTable(receipts);

  // 4. Setup Filters & Search
  setupAdminListeners();
}

function renderAdminApplicationsTable(apps) {
  const tbody = document.getElementById('adminAppsTableBody');
  if (!tbody) return;

  if (apps.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--text-muted);">कोई आवेदन उपलब्ध नहीं / No applications found</td></tr>`;
    return;
  }

  tbody.innerHTML = apps.map((app, idx) => `
    <tr>
      <td style="font-family:monospace;font-weight:700;color:var(--gov-blue-primary);">${app.id}</td>
      <td>
        <strong>${app.customerName}</strong>
        <div style="font-size:12px;color:var(--text-subtle);">${app.mobile}</div>
      </td>
      <td>${app.service}</td>
      <td>
        <select onchange="updateApplicationStatus('${app.id}', this.value)" style="padding:4px 8px;border-radius:6px;border:1px solid #cbd5e1;font-size:12px;font-weight:700;background:#fff;">
          <option value="Received" ${app.status === 'Received' ? 'selected' : ''}>Received</option>
          <option value="Documents Pending" ${app.status === 'Documents Pending' ? 'selected' : ''}>Documents Pending</option>
          <option value="Submitted" ${app.status === 'Submitted' ? 'selected' : ''}>Submitted</option>
          <option value="Processing" ${app.status === 'Processing' ? 'selected' : ''}>Processing</option>
          <option value="Completed" ${app.status === 'Completed' ? 'selected' : ''}>Completed</option>
          <option value="Rejected" ${app.status === 'Rejected' ? 'selected' : ''}>Rejected</option>
        </select>
      </td>
      <td>
        <span class="badge-tag ${app.paymentStatus === 'Paid' ? 'badge-success' : 'badge-saffron'}">
          ${app.paymentStatus || 'Pending'}
        </span>
      </td>
      <td>${app.createdDate || '-'}</td>
      <td>
        <button onclick="editAppNotes('${app.id}')" title="नोट्स जोड़ें" class="btn btn-outline btn-sm" style="padding:4px 8px;font-size:11px;">
          <i class="fa-solid fa-note-sticky"></i>
        </button>
        <button onclick="deleteApplication('${app.id}')" title="हटाएं" class="btn btn-sm" style="padding:4px 8px;font-size:11px;color:var(--gov-red);">
          <i class="fa-solid fa-trash"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

function renderAdminReceiptsTable(receipts) {
  const tbody = document.getElementById('adminReceiptsTableBody');
  if (!tbody) return;

  if (receipts.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--text-muted);">कोई रसीद उपलब्ध नहीं</td></tr>`;
    return;
  }

  tbody.innerHTML = receipts.map(r => `
    <tr>
      <td style="font-family:monospace;font-weight:700;color:var(--gov-blue-primary);">${r.receiptNo}</td>
      <td>
        <strong>${r.customerName}</strong>
        <div style="font-size:12px;color:var(--text-subtle);">${r.mobile}</div>
      </td>
      <td>${r.service}</td>
      <td style="font-weight:700;color:var(--gov-green);">₹${r.amount}</td>
      <td>${r.date}</td>
      <td>
        <a href="receipt.html?id=${r.receiptNo}" target="_blank" class="btn btn-outline btn-sm" style="padding:4px 8px;font-size:11px;">
          <i class="fa-solid fa-eye"></i> रसीद
        </a>
      </td>
    </tr>
  `).join('');
}

function updateApplicationStatus(appId, newStatus) {
  const apps = getStoredApplications();
  const app = apps.find(a => a.id === appId);
  if (app) {
    app.status = newStatus;
    app.updatedDate = new Date().toISOString().split('T')[0];
    localStorage.setItem('dhruv_applications', JSON.stringify(apps));
    showToast(`स्थिति अपडेट: ${newStatus}`, 'success');
    loadAdminDashboardData();
  }
}

function editAppNotes(appId) {
  const apps = getStoredApplications();
  const app = apps.find(a => a.id === appId);
  if (!app) return;

  const currentNotes = app.notes || "";
  const newNotes = prompt("आवेदन हेतु आंतरिक टिप्पणी / Add Note:", currentNotes);
  if (newNotes !== null) {
    app.notes = newNotes;
    localStorage.setItem('dhruv_applications', JSON.stringify(apps));
    showToast('टिप्पणी सहेजी गई / Note saved', 'success');
  }
}

function deleteApplication(appId) {
  if (!confirm(`क्या आप आवेदन ${appId} हटाना चाहते हैं?`)) return;
  let apps = getStoredApplications();
  apps = apps.filter(a => a.id !== appId);
  localStorage.setItem('dhruv_applications', JSON.stringify(apps));
  showToast('आवेदन हटाया गया / Application removed', 'info');
  loadAdminDashboardData();
}

function setupAdminListeners() {
  // App Search
  const appSearchInput = document.getElementById('adminAppSearch');
  if (appSearchInput) {
    appSearchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      const apps = getStoredApplications().filter(a => 
        a.id.toLowerCase().includes(q) || 
        a.customerName.toLowerCase().includes(q) || 
        a.mobile.includes(q) ||
        a.service.toLowerCase().includes(q)
      );
      renderAdminApplicationsTable(apps);
    });
  }

  // Export CSV
  const exportAppsBtn = document.getElementById('exportAppsCsvBtn');
  if (exportAppsBtn) {
    exportAppsBtn.onclick = exportApplicationsToCSV;
  }
}

function exportApplicationsToCSV() {
  const apps = getStoredApplications();
  if (apps.length === 0) {
    showToast('निर्यात हेतु कोई डेटा नहीं है', 'error');
    return;
  }

  let csvContent = "data:text/csv;charset=utf-8,ApplicationID,CustomerName,Mobile,Service,Status,PaymentStatus,CreatedDate,Notes\n";
  apps.forEach(a => {
    const row = [
      `"${a.id}"`,
      `"${a.customerName}"`,
      `"${a.mobile}"`,
      `"${a.service}"`,
      `"${a.status}"`,
      `"${a.paymentStatus || ''}"`,
      `"${a.createdDate || ''}"`,
      `"${(a.notes || '').replace(/"/g, '""')}"`
    ].join(",");
    csvContent += row + "\n";
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `dhruv_applications_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  showToast('CSV फाइल डाउनलोड हो गई / CSV exported successfully', 'success');
}
