/**
 * DHRUV E-MITRA SEVA KENDRA - CORE APPLICATION LOGIC
 * Handles Bilingual Switcher (Hindi/English), Mobile Drawer, Bottom Nav, Modals,
 * Toasts, Data Persistence, and Contextual WhatsApp Links.
 */

// Initialize or Retrieve Active Language
let currentLang = localStorage.getItem('dhruv_lang') || 'hi';

document.addEventListener('DOMContentLoaded', () => {
  initLanguage();
  initMobileDrawer();
  initBottomNavActiveState();
  initAnnouncement();
  initLocalDataSeeds();
  initScrollTopButton();
});

/* ==========================================================================
   BILINGUAL (HINDI / ENGLISH) SYSTEM
   ========================================================================== */
function initLanguage() {
  applyLanguage(currentLang);
  const langBtn = document.getElementById('langSwitchBtn');
  if (langBtn) {
    langBtn.addEventListener('click', toggleLanguage);
  }
}

function toggleLanguage() {
  currentLang = currentLang === 'hi' ? 'en' : 'hi';
  localStorage.setItem('dhruv_lang', currentLang);
  applyLanguage(currentLang);

  // Trigger page-specific re-renders if available
  if (typeof renderServicesDirectory === 'function') renderServicesDirectory();
  if (typeof renderFormsLibrary === 'function') renderFormsLibrary();
  if (typeof renderFaqAccordion === 'function') renderFaqAccordion();
  if (typeof updatePricingPageLabels === 'function') updatePricingPageLabels();

  showToast(currentLang === 'hi' ? 'भाषा: हिन्दी सेट की गई' : 'Language set to English', 'success');
}

function applyLanguage(lang) {
  document.documentElement.lang = lang;
  const dict = I18N[lang] || I18N.hi;

  // Update all elements with data-i18n attribute
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (dict[key]) {
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = dict[key];
      } else {
        el.innerHTML = dict[key];
      }
    }
  });

  // Update Language Switcher Button Label
  const langBtn = document.getElementById('langSwitchBtn');
  if (langBtn) {
    langBtn.innerHTML = lang === 'hi'
      ? `<i class="fa-solid fa-globe"></i> English`
      : `<i class="fa-solid fa-globe"></i> हिंदी`;
  }

  // Update Announcement Text
  initAnnouncement();
}

/* ==========================================================================
   ANNOUNCEMENT BANNER
   ========================================================================== */
function initAnnouncement() {
  const noticeEl = document.getElementById('noticeTickerText');
  if (!noticeEl || !DHRUV_CONFIG.announcement) return;
  
  if (DHRUV_CONFIG.announcement.enabled) {
    noticeEl.textContent = currentLang === 'hi' 
      ? DHRUV_CONFIG.announcement.textHi 
      : DHRUV_CONFIG.announcement.textEn;
  } else {
    const noticeBar = document.querySelector('.top-notice-bar');
    if (noticeBar) noticeBar.style.display = 'none';
  }
}

/* ==========================================================================
   MOBILE MENU & BOTTOM NAV
   ========================================================================== */
function initMobileDrawer() {
  const hamBtn = document.getElementById('hamburgerBtn');
  const drawer = document.getElementById('mobileDrawer');
  if (!hamBtn || !drawer) return;

  hamBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    drawer.classList.toggle('open');
    const icon = hamBtn.querySelector('i');
    if (icon) {
      icon.className = drawer.classList.contains('open') ? 'fa-solid fa-xmark' : 'fa-solid fa-bars';
    }
  });

  document.addEventListener('click', (e) => {
    if (!drawer.contains(e.target) && !hamBtn.contains(e.target)) {
      drawer.classList.remove('open');
      const icon = hamBtn.querySelector('i');
      if (icon) icon.className = 'fa-solid fa-bars';
    }
  });
}

function initBottomNavActiveState() {
  const currentPath = window.location.pathname.toLowerCase();
  const tabs = document.querySelectorAll('.bottom-tab');
  
  tabs.forEach(tab => {
    const href = tab.getAttribute('href');
    if (href) {
      const cleanHref = href.toLowerCase();
      if ((cleanHref === 'index.html' || cleanHref === './' || cleanHref === '/') && (currentPath.endsWith('index.html') || currentPath.endsWith('/'))) {
        tab.classList.add('active');
      } else if (currentPath.includes(cleanHref.replace('.html', ''))) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    }
  });
}

/* ==========================================================================
   SCROLL TO TOP
   ========================================================================== */
function initScrollTopButton() {
  const topBtn = document.getElementById('scrollTopBtn');
  if (!topBtn) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 350) {
      topBtn.classList.add('show');
    } else {
      topBtn.classList.remove('show');
    }
  });

  topBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* ==========================================================================
   TOAST NOTIFICATION SYSTEM
   ========================================================================== */
function showToast(message, type = 'info') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let icon = 'fa-info-circle';
  let color = 'var(--gov-blue-primary)';
  if (type === 'success') { icon = 'fa-circle-check'; color = 'var(--gov-green)'; }
  if (type === 'error') { icon = 'fa-circle-exclamation'; color = 'var(--gov-red)'; }

  toast.innerHTML = `<i class="fa-solid ${icon}" style="color:${color}"></i> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideInRight 0.3s ease reverse forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

/* ==========================================================================
   MODAL COMPONENT
   ========================================================================== */
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }
}

// Service Details / Documents Checklist Modal
function showServiceDetails(serviceId) {
  const svc = SERVICES_DATA.find(s => s.id === serviceId);
  if (!svc) return;

  const modal = document.getElementById('serviceModal');
  if (!modal) return;

  const titleEl = document.getElementById('modalServiceTitle');
  const deptEl = document.getElementById('modalServiceDept');
  const descEl = document.getElementById('modalServiceDesc');
  const docsListEl = document.getElementById('modalServiceDocsList');
  const timelineEl = document.getElementById('modalServiceTimeline');
  const feeEl = document.getElementById('modalServiceFee');
  const applyBtn = document.getElementById('modalServiceApplyBtn');
  const officialBtn = document.getElementById('modalServiceOfficialBtn');

  if (titleEl) titleEl.textContent = currentLang === 'hi' ? svc.nameHi : svc.nameEn;
  if (deptEl) deptEl.textContent = svc.department;
  if (descEl) descEl.textContent = currentLang === 'hi' ? svc.descriptionHi : svc.descriptionEn;
  if (timelineEl) timelineEl.textContent = svc.processingDays;
  if (feeEl) feeEl.textContent = svc.feeRange;

  if (docsListEl) {
    docsListEl.innerHTML = svc.requiredDocs.map(doc => `
      <li style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #f1f5f9;">
        <i class="fa-solid fa-circle-check" style="color:var(--gov-green);font-size:14px;"></i>
        <span>${doc}</span>
      </li>
    `).join('');
  }

  if (applyBtn) {
    applyBtn.onclick = () => {
      closeModal('serviceModal');
      openWhatsAppForService(svc.nameEn);
    };
  }

  if (officialBtn) {
    officialBtn.href = svc.officialUrl || DHRUV_CONFIG.officialEmitra.portal;
  }

  openModal('serviceModal');
}

/* ==========================================================================
   WHATSAPP CONTEXTUAL LINK GENERATORS
   ========================================================================== */
function openWhatsAppForService(serviceName) {
  const text = encodeURIComponent(`नमस्ते ध्रुव ई-मित्र, मुझे "${serviceName}" सेवा के लिए आवेदन / जानकारी चाहिए। कृपया मार्गदर्शन करें।`);
  window.open(`https://wa.me/${DHRUV_CONFIG.whatsapp}?text=${text}`, '_blank');
}

function openWhatsAppForStatus(refId) {
  const text = encodeURIComponent(`नमस्ते ध्रुव ई-मित्र, मैं अपने आवेदन/लेन-देन स्थिति (Ref ID: ${refId || ''}) की जानकारी चाहता हूँ।`);
  window.open(`https://wa.me/${DHRUV_CONFIG.whatsapp}?text=${text}`, '_blank');
}

function openWhatsAppForForm(formTitle) {
  const text = encodeURIComponent(`नमस्ते, मुझे राजस्थान सरकारी फॉर्म "${formTitle}" के संबंध में जानकारी व सहायता चाहिए।`);
  window.open(`https://wa.me/${DHRUV_CONFIG.whatsapp}?text=${text}`, '_blank');
}

function openWhatsAppForReceipt(receiptNo) {
  const text = encodeURIComponent(`नमस्ते, मैंने ध्रुव ई-मित्र सेवा केंद्र पर भुगतान किया है। रसीद संख्या: ${receiptNo}। कृपया पुष्टि करें।`);
  window.open(`https://wa.me/${DHRUV_CONFIG.whatsapp}?text=${text}`, '_blank');
}

/* ==========================================================================
   LOCAL DATA STORAGE & PERSISTENCE
   Seeds mock verified data for testing if no entries exist.
   ========================================================================== */
function initLocalDataSeeds() {
  // Clear any legacy dummy sample seeds if present
  try {
    const apps = JSON.parse(localStorage.getItem('dhruv_applications')) || [];
    const cleanApps = apps.filter(a => !a.id.includes('DMSK-2026-APP'));
    localStorage.setItem('dhruv_applications', JSON.stringify(cleanApps));

    const receipts = JSON.parse(localStorage.getItem('dhruv_receipts')) || [];
    const cleanReceipts = receipts.filter(r => !r.receiptNo.includes('DMSK-2026-00000'));
    localStorage.setItem('dhruv_receipts', JSON.stringify(cleanReceipts));
  } catch (e) {
    // Ignore storage parse errors
  }
}

function getStoredApplications() {
  try {
    return JSON.parse(localStorage.getItem('dhruv_applications')) || [];
  } catch (e) {
    return [];
  }
}

function saveApplication(app) {
  const apps = getStoredApplications();
  apps.unshift(app);
  localStorage.setItem('dhruv_applications', JSON.stringify(apps));
  return app;
}

function getStoredReceipts() {
  try {
    return JSON.parse(localStorage.getItem('dhruv_receipts')) || [];
  } catch (e) {
    return [];
  }
}

function saveReceipt(receipt) {
  const receipts = getStoredReceipts();
  receipts.unshift(receipt);
  localStorage.setItem('dhruv_receipts', JSON.stringify(receipts));
  return receipt;
}
