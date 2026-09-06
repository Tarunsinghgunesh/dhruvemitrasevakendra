# Dhruv E-Mitra Seva Kendra (ध्रुव ई-मित्र सेवा केंद्र)
Official Portal: [https://tarunsinghgunesh.github.io/dhruvemitrasevakendra/](https://tarunsinghgunesh.github.io/dhruvemitrasevakendra/)

A premium, trustworthy, mobile-first digital e-Mitra service portal inspired by modern Rajasthan e-Governance design language.

---

## 🌟 Core Features

1. **Modern Rajasthan e-Governance Design System**:
   - Palette: Deep Royal Blue (`#0c3875`), Saffron Accent (`#ea580c`), Emerald Status (`#059669`), Clean White Backgrounds (`#f8fafc`).
   - Clean typography using Google Fonts: *Outfit* & *Noto Sans Devanagari*.
   - Accessibility compliant, high-contrast, touch-friendly interfaces.
   - Sticky mobile bottom navigation (Home, Services, Forms, Status, Pay).

2. **Bilingual Support (Hindi + English)**:
   - Dynamic one-click language switcher (`हिंदी | English`).
   - Saves language preference across all pages in `localStorage`.

3. **Quick Service Dashboard & Complete Directory (`services.html`)**:
   - 12-Card Popular Services Dashboard on the homepage.
   - 15 Categories & 50+ Real Rajasthan Government & Citizen Services.
   - Real-time search in Hindi & English.
   - Interactive modal with required documents checklist, timeline, and official source links.

4. **Forms & Guidelines Hub (`forms.html`)**:
   - 18 Categories of verified Rajasthan Government forms and affidavits (Caste, Bonafide, Income, Jan Aadhaar, Ration Card, Pension, Labour, etc.).
   - Search bar: 🔎 *"आप कौन-सा फॉर्म ढूंढ रहे हैं?"*.
   - Direct PDF viewing, download, and official Rajasthan e-Mitra report links.

5. **Application & Service Status Tracker (`status.html`)**:
   - Professional, truthful status portal.
   - Informs users that application tracking is being updated and provides direct 1-tap WhatsApp and Call support to check their status with Dhruv E-Mitra Seva Kendra.
   - Direct link to the official Rajasthan Government e-Mitra token tracker (`https://emitra.rajasthan.gov.in/emitra/track`).

6. **Secure Razorpay Payment System (`payment.html`)**:
   - Professional Razorpay payment flow (User -> Select Service -> Enter Details -> Enter Amount -> Pay with Razorpay -> Server-side Verification -> Generate A4 Receipt).
   - Secret keys never exposed in frontend.
   - When API/backend is not yet configured, cleanly displays "Online payment will be available soon" with direct contact options.
   - Zero fake payment records or dummy transaction IDs.

7. **Digital Invoice & Receipt System (`receipt.html`)**:
   - Unique receipt numbers generated: `DMSK-2026-XXXXXX`.
   - Verified **PAID** stamp, customer details, QR verification code.
   - Dedicated print stylesheet (`css/print.css`) for high-quality **A4 PDF** generation.
   - 1-click WhatsApp Receipt sharing.
   - Public receipt lookup by receipt/invoice number.

8. **Operator & Admin Management Dashboard (`admin.html`)**:
   - PIN-protected login (Default PIN: `8240`).
   - Real-time metrics: Today's Applications, Pending Applications, Completed, Total Revenue, Total Receipts.
   - Application lifecycle manager: Change statuses (Received, Documents Pending, Submitted, Processing, Completed, Rejected) and add internal notes.
   - Export applications to CSV.

---

## 📁 Project Architecture

```
dhruvemitrasevakendra/
├── index.html              # Homepage with Top Notice, Hero, Quick Services, Trust, FAQ, Map
├── services.html           # 50+ Services Directory with Category filters & Doc checklists
├── forms.html              # Government Forms & Guidelines Hub with PDF download
├── status.html             # Application & Transaction Status Tracker
├── payment.html            # Pay Service Charges Securely (Razorpay Checkout)
├── receipt.html            # Digital Invoice & Receipt (A4 Print / PDF / Lookup)
├── admin.html              # Operator Control Center & Metrics
├── 404.html                # Custom 404 handler for clean navigation
├── .nojekyll               # GitHub Pages compatibility flag
├── css/
│   ├── style.css           # Core Design System & Components
│   └── print.css           # A4 Invoice & Receipt Print Stylesheet
├── js/
│   ├── data.js             # Central Data Layer (Services, Forms, Pricing, FAQs, I18n)
│   ├── app.js              # Bilingual Engine, Mobile Drawer, Bottom Bar, Modals, Toasts
│   ├── payment.js          # Razorpay checkout handler & receipt generator
│   ├── receipt.js          # Receipt lookup, A4 rendering, and WhatsApp sharing
│   └── admin.js            # Admin authentication, status manager, and CSV export
├── api/                    # Vercel Serverless Functions
│   ├── create-order.js     # Server-side Razorpay Order Creator
│   └── verify-payment.js   # Server-side HMAC-SHA256 signature verification
└── vercel.json             # Vercel deployment configuration
```

---

## 🚀 Deployment

### GitHub Pages (Static Hosting)
1. Push changes to branch `main`.
2. Repository Settings -> Pages -> Source: `Deploy from a branch` -> Branch: `main` / `(root)`.
3. The site is live at `https://tarunsinghgunesh.github.io/dhruvemitrasevakendra/`.
4. Everything (services, forms, status, payment test mode, digital receipts, A4 print, admin panel) works 100% client-side with zero external build requirements!

### Vercel (Full-Stack with Serverless Razorpay)
1. Connect the GitHub repository in [Vercel](https://vercel.com).
2. Configure Environment Variables in Project Settings:
   - `RAZORPAY_KEY_ID` = `your_razorpay_key_id`
   - `RAZORPAY_KEY_SECRET` = `your_razorpay_key_secret`
3. Deploy! The `/api/create-order` and `/api/verify-payment` endpoints will automatically activate.

---

## 🔐 Security Best Practices
- **No Private Keys Exposed**: The Razorpay secret key is never stored in frontend code.
- **Client-Side Test Mode**: In static environments, test simulation mode generates genuine invoice records safely.
- **Official Disclaimers**: All government links point to official department portals (`emitra.rajasthan.gov.in`, `janaadhaar.rajasthan.gov.in`, etc.).
