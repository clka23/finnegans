/* ═══════════════════════════════════════════
   FINNEGAN'S — ADMIN scripts.js v2
═══════════════════════════════════════════ */

/* ─── Animations CSS injectées ─── */
const adminStyle = document.createElement('style');
adminStyle.textContent = `
  @keyframes fadeOut { to { opacity: 0; pointer-events: none; } }
  @keyframes shake {
    0%,100% { transform:translateX(0); }
    20%      { transform:translateX(-8px); }
    40%      { transform:translateX(8px); }
    60%      { transform:translateX(-5px); }
    80%      { transform:translateX(5px); }
  }
`;
document.head.appendChild(adminStyle);


/* ═══════════════════════════════════════════
   CONSTANTES TEMPORAIRES
   (à remplacer par Firebase Auth)
═══════════════════════════════════════════ */
const TEMP_EMAIL    = 'admin@finnegans.fr';
const TEMP_PASSWORD = 'finnegans2025';


/* ═══════════════════════════════════════════
   LOGIN
═══════════════════════════════════════════ */
const loginScreen = document.getElementById('login-screen');
const adminScreen = document.getElementById('admin-screen');
const loginForm   = document.getElementById('login-form');
const loginError  = document.getElementById('login-error');
const togglePw    = document.getElementById('toggle-pw');
const loginPw     = document.getElementById('login-password');
const topbarUser  = document.getElementById('topbar-user');

loginForm.addEventListener('submit', e => {
  e.preventDefault();
  loginError.textContent = '';

  const email = document.getElementById('login-email').value.trim();
  const pw    = loginPw.value;

  if (!email || !pw) {
    loginError.textContent = 'Veuillez remplir tous les champs.';
    return;
  }

  // Simulation — remplacer par firebase.auth().signInWithEmailAndPassword(email, pw)
  if (email === TEMP_EMAIL && pw === TEMP_PASSWORD) {
    loginScreen.style.animation = 'fadeOut 0.4s ease forwards';
    setTimeout(() => {
      loginScreen.classList.add('hidden');
      adminScreen.classList.remove('hidden');
      topbarUser.textContent = email;
    }, 380);
  } else {
    loginError.textContent = 'Identifiants incorrects.';
    document.querySelector('.login-box').style.animation = 'shake 0.4s ease';
    setTimeout(() => document.querySelector('.login-box').style.animation = '', 420);
  }
});

togglePw.addEventListener('click', () => {
  const show = loginPw.type === 'password';
  loginPw.type = show ? 'text' : 'password';
  togglePw.style.opacity = show ? '1' : '0.5';
});

document.getElementById('btn-logout').addEventListener('click', () => {
  // firebase.auth().signOut()
  adminScreen.classList.add('hidden');
  loginScreen.classList.remove('hidden');
  loginScreen.style.animation = '';
  loginForm.reset();
  loginError.textContent = '';
});


/* ═══════════════════════════════════════════
   PANNEAUX LATÉRAUX
═══════════════════════════════════════════ */
const panelOverlay = document.getElementById('panel-overlay');

function openPanel(name) {
  closeAllPanels();
  const panel = document.getElementById(`panel-${name}`);
  if (!panel) return;
  panel.classList.add('open');
  panelOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeAllPanels() {
  document.querySelectorAll('.side-panel').forEach(p => p.classList.remove('open'));
  panelOverlay.classList.remove('active');
  document.body.style.overflow = '';
}

document.querySelectorAll('.dash-card').forEach(card => {
  card.addEventListener('click', () => openPanel(card.dataset.panel));
});

document.querySelectorAll('.panel-close').forEach(btn => {
  btn.addEventListener('click', closeAllPanels);
});

panelOverlay.addEventListener('click', closeAllPanels);
document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeAllPanels(); closeAllModales(); } });


/* ═══════════════════════════════════════════
   MODALES
═══════════════════════════════════════════ */
function openModale(id) {
  document.getElementById(id).classList.remove('hidden');
}
function closeModale(id) {
  document.getElementById(id).classList.add('hidden');
}
function closeAllModales() {
  document.querySelectorAll('.modale-overlay').forEach(m => m.classList.add('hidden'));
}


/* ═══════════════════════════════════════════
   CARTE — CATÉGORIES
═══════════════════════════════════════════ */
let categories = ['Bières', 'Cocktails', 'Softs', 'Restauration'];
let renamingIndex = null;

function renderCategories() {
  const list = document.getElementById('categories-list');
  const select = document.getElementById('article-cat');

  list.innerHTML = '';
  select.innerHTML = '';

  categories.forEach((cat, i) => {
    // Tag dans la liste
    const tag = document.createElement('div');
    tag.className = 'tag-item';
    tag.innerHTML = `
      <span class="tag-name" title="Renommer" data-index="${i}">${cat}</span>
      <button class="tag-btn" title="Supprimer" data-index="${i}">✕</button>
    `;
    list.appendChild(tag);

    // Option dans le select article
    const opt = document.createElement('option');
    opt.value = cat.toLowerCase();
    opt.textContent = cat;
    select.appendChild(opt);
  });

  // Renommer au clic sur le nom
  list.querySelectorAll('.tag-name').forEach(el => {
    el.addEventListener('click', () => {
      renamingIndex = parseInt(el.dataset.index);
      document.getElementById('rename-cat-input').value = categories[renamingIndex];
      openModale('modale-rename-cat');
      setTimeout(() => document.getElementById('rename-cat-input').focus(), 100);
    });
  });

  // Supprimer
  list.querySelectorAll('.tag-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const i = parseInt(btn.dataset.index);
      categories.splice(i, 1);
      renderCategories();
      // TODO Firebase : supprimer dans Firestore
    });
  });
}

// Ajouter une catégorie
document.getElementById('btn-add-cat').addEventListener('click', () => {
  const input = document.getElementById('new-cat-input');
  const val = input.value.trim();
  if (!val) return;
  if (categories.map(c => c.toLowerCase()).includes(val.toLowerCase())) {
    input.style.borderColor = '#e57373';
    setTimeout(() => input.style.borderColor = '', 1200);
    return;
  }
  categories.push(val);
  input.value = '';
  renderCategories();
  // TODO Firebase : ajouter dans Firestore
});

document.getElementById('new-cat-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('btn-add-cat').click();
});

// Modale renommer
document.getElementById('rename-cat-confirm').addEventListener('click', () => {
  const newName = document.getElementById('rename-cat-input').value.trim();
  if (!newName || renamingIndex === null) return;
  categories[renamingIndex] = newName;
  renderCategories();
  closeModale('modale-rename-cat');
  renamingIndex = null;
  // TODO Firebase : mettre à jour dans Firestore
});

document.getElementById('rename-cat-cancel').addEventListener('click', () => closeModale('modale-rename-cat'));
document.getElementById('modale-rename-close').addEventListener('click', () => closeModale('modale-rename-cat'));

document.getElementById('rename-cat-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('rename-cat-confirm').click();
});

renderCategories();


/* ═══════════════════════════════════════════
   CARTE — VARIANTES DE PRIX
═══════════════════════════════════════════ */
function addVariante(label = '', price = '') {
  const row = document.createElement('div');
  row.className = 'variante-row';
  row.innerHTML = `
    <input type="text" class="v-label" placeholder="ex : Pinte 50cl" value="${label}" />
    <input type="text" class="v-price" placeholder="ex : 7,50 €" value="${price}" />
    <button class="btn-remove-variante" title="Supprimer">✕</button>
  `;
  row.querySelector('.btn-remove-variante').addEventListener('click', () => row.remove());
  document.getElementById('variantes-list').appendChild(row);
}

document.getElementById('btn-add-variante').addEventListener('click', () => addVariante());

// Ajouter une variante vide au départ
addVariante();

// Sauvegarder un article (structure prête pour Firebase)
document.getElementById('btn-save-article').addEventListener('click', () => {
  const feedback = document.getElementById('article-feedback');
  const nom = document.getElementById('article-nom').value.trim();
  const cat = document.getElementById('article-cat').value;
  const desc = document.getElementById('article-desc').value.trim();

  const variantes = [];
  document.querySelectorAll('.variante-row').forEach(row => {
    const l = row.querySelector('.v-label').value.trim();
    const p = row.querySelector('.v-price').value.trim();
    if (l && p) variantes.push({ label: l, price: p });
  });

  if (!nom || !cat) {
    feedback.textContent = 'Le nom et la catégorie sont obligatoires.';
    feedback.className = 'form-feedback error';
    return;
  }

  // Structure prête pour Firestore :
  // { categorie: cat, nom, description: desc, variantes }
  console.log('Article à sauvegarder :', { categorie: cat, nom, description: desc, variantes });

  feedback.textContent = '✓ Article prêt (Firebase requis pour sauvegarder).';
  feedback.className = 'form-feedback success';
  setTimeout(() => feedback.textContent = '', 3000);
});


/* ═══════════════════════════════════════════
   ÉVÉNEMENTS
═══════════════════════════════════════════ */

// Date min = aujourd'hui
const eventDateInput = document.getElementById('event-date');
const today = new Date().toISOString().split('T')[0];
eventDateInput.setAttribute('min', today);

document.getElementById('btn-save-event').addEventListener('click', () => {
  const feedback = document.getElementById('event-feedback');
  const date  = document.getElementById('event-date').value;
  const titre = document.getElementById('event-titre').value.trim();
  const desc  = document.getElementById('event-desc').value.trim();
  const tag   = document.getElementById('event-tag').value.trim();

  if (!date || !titre) {
    feedback.textContent = 'La date et le titre sont obligatoires.';
    feedback.className = 'form-feedback error';
    return;
  }

  // Formater le jour et mois pour le site public
  const d = new Date(date + 'T00:00:00');
  const jour = d.getDate();
  const mois = d.toLocaleString('fr-FR', { month: 'long' });
  const moisCap = mois.charAt(0).toUpperCase() + mois.slice(1);

  // Structure prête pour Firestore :
  // { date, jour, mois: moisCap, titre, description: desc, tag }
  console.log('Événement à sauvegarder :', { date, jour, mois: moisCap, titre, description: desc, tag });

  feedback.textContent = '✓ Événement prêt (Firebase requis pour sauvegarder).';
  feedback.className = 'form-feedback success';
  setTimeout(() => {
    feedback.textContent = '';
    document.getElementById('event-date').value = '';
    document.getElementById('event-titre').value = '';
    document.getElementById('event-desc').value = '';
    document.getElementById('event-tag').value = '';
  }, 3000);
});


/* ═══════════════════════════════════════════
   POPUP — UPLOAD IMAGE
═══════════════════════════════════════════ */
const popupImgInput   = document.getElementById('popup-img-input');
const uploadZone      = document.getElementById('upload-zone');
const uploadPlaceholder = document.getElementById('upload-placeholder');
const uploadImgPreview  = document.getElementById('upload-img-preview');
const uploadRemoveBtn   = document.getElementById('upload-remove');

document.getElementById('upload-btn').addEventListener('click', () => popupImgInput.click());
uploadPlaceholder.addEventListener('click', () => popupImgInput.click());

popupImgInput.addEventListener('change', () => {
  const file = popupImgInput.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) {
    alert('Image trop lourde. Maximum : 5 Mo.');
    return;
  }
  const reader = new FileReader();
  reader.onload = e => {
    uploadImgPreview.src = e.target.result;
    uploadImgPreview.classList.remove('hidden');
    uploadPlaceholder.classList.add('hidden');
    uploadRemoveBtn.classList.remove('hidden');
  };
  reader.readAsDataURL(file);
});

// Drag & drop
uploadZone.addEventListener('dragover', e => { e.preventDefault(); uploadZone.style.borderColor = 'var(--gold)'; });
uploadZone.addEventListener('dragleave', () => { uploadZone.style.borderColor = ''; });
uploadZone.addEventListener('drop', e => {
  e.preventDefault();
  uploadZone.style.borderColor = '';
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) {
    const dt = new DataTransfer();
    dt.items.add(file);
    popupImgInput.files = dt.files;
    popupImgInput.dispatchEvent(new Event('change'));
  }
});

uploadRemoveBtn.addEventListener('click', () => {
  popupImgInput.value = '';
  uploadImgPreview.src = '';
  uploadImgPreview.classList.add('hidden');
  uploadPlaceholder.classList.remove('hidden');
  uploadRemoveBtn.classList.add('hidden');
});

document.getElementById('btn-save-popup').addEventListener('click', () => {
  const feedback = document.getElementById('popup-feedback');
  const titre  = document.getElementById('popup-titre').value.trim();
  const desc   = document.getElementById('popup-desc').value.trim();
  const active = document.getElementById('popup-active').checked;

  console.log('Popup à sauvegarder :', { active, titre, description: desc, image: popupImgInput.files[0]?.name });

  feedback.textContent = '✓ Popup prête (Firebase requis pour sauvegarder).';
  feedback.className = 'form-feedback success';
  setTimeout(() => feedback.textContent = '', 3000);
});


/* ═══════════════════════════════════════════
   HORAIRES — GÉNÉRATION DES JOURS
═══════════════════════════════════════════ */
const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

// Créneaux toutes les 30 min de 6h00 à 5h30 (lendemain)
function buildTimeOptions() {
  const options = [];
  for (let h = 6; h < 30; h++) {
    const hh = h % 24;
    const label = `${String(hh).padStart(2,'0')}h${h % 1 === 0.5 ? '30' : '00'}`;
    options.push(`<option value="${label}">${label}</option>`);
    const label2 = `${String(hh).padStart(2,'0')}h30`;
    options.push(`<option value="${label2}">${label2}</option>`);
  }
  return options.join('');
}

// Correction : générer proprement toutes les demi-heures
function buildTimeOptionsClean() {
  const opts = ['<option value="">—</option>'];
  for (let total = 6 * 60; total < 30 * 60; total += 30) {
    const h = Math.floor(total / 60) % 24;
    const m = total % 60;
    const label = `${String(h).padStart(2,'0')}h${m === 0 ? '00' : '30'}`;
    opts.push(`<option value="${label}">${label}</option>`);
  }
  return opts.join('');
}

const timeOpts = buildTimeOptionsClean();

function buildHorairesGrid() {
  const grid = document.getElementById('horaires-grid');
  grid.innerHTML = '';

  JOURS.forEach(jour => {
    const id = jour.toLowerCase();
    const block = document.createElement('div');
    block.className = 'horaire-day';
    block.dataset.jour = id;
    block.innerHTML = `
      <div class="horaire-day-header">
        <span class="horaire-day-name">${jour}</span>
        <label class="horaire-closed-wrap">
          <input type="checkbox" class="closed-cb" data-jour="${id}" />
          Fermé
        </label>
      </div>
      <div class="horaire-plages">
        <div class="horaire-plage">
          <span style="font-size:0.68rem;opacity:0.5;min-width:16px">1</span>
          <select class="h-open" data-jour="${id}" data-plage="1">${timeOpts}</select>
          <span class="plage-sep">→</span>
          <select class="h-close" data-jour="${id}" data-plage="1">${timeOpts}</select>
        </div>
        <div class="horaire-plage">
          <span style="font-size:0.68rem;opacity:0.5;min-width:16px">2</span>
          <select class="h-open" data-jour="${id}" data-plage="2">${timeOpts}</select>
          <span class="plage-sep">→</span>
          <select class="h-close" data-jour="${id}" data-plage="2">${timeOpts}</select>
        </div>
      </div>
    `;

    // Case Fermé
    block.querySelector('.closed-cb').addEventListener('change', function() {
      block.classList.toggle('is-closed', this.checked);
    });

    grid.appendChild(block);
  });
}

buildHorairesGrid();

// Sauvegarder les infos pratiques
document.getElementById('btn-save-infos').addEventListener('click', () => {
  const feedback = document.getElementById('infos-feedback');

  const rue   = document.getElementById('infos-rue').value.trim();
  const ville = document.getElementById('infos-ville').value.trim();
  const tel   = document.getElementById('infos-tel').value.trim();
  const email = document.getElementById('infos-email').value.trim();

  const horaires = {};
  JOURS.forEach(jour => {
    const id = jour.toLowerCase();
    const block = document.querySelector(`.horaire-day[data-jour="${id}"]`);
    const ferme = block.querySelector('.closed-cb').checked;
    const plages = block.querySelectorAll('.horaire-plage');
    const data = { ferme, plages: [] };
    plages.forEach(p => {
      const open  = p.querySelector('.h-open').value;
      const close = p.querySelector('.h-close').value;
      if (open && close) data.plages.push({ open, close });
    });
    horaires[id] = data;
  });

  // Structure prête pour Firestore :
  // { adresse: {rue, ville}, horaires, contact: {tel, email} }
  console.log('Infos à sauvegarder :', { adresse: { rue, ville }, horaires, contact: { tel, email } });

  feedback.textContent = '✓ Infos prêtes (Firebase requis pour sauvegarder).';
  feedback.className = 'form-feedback success';
  setTimeout(() => feedback.textContent = '', 3000);
});


/* ═══════════════════════════════════════════
   MON COMPTE — MOT DE PASSE
═══════════════════════════════════════════ */
document.getElementById('btn-change-pw').addEventListener('click', () => {
  const feedback = document.getElementById('pw-feedback');
  const oldPw  = document.getElementById('compte-pw-old').value;
  const newPw  = document.getElementById('compte-pw-new').value;
  const confPw = document.getElementById('compte-pw-confirm').value;

  if (!oldPw || !newPw || !confPw) {
    feedback.textContent = 'Tous les champs sont requis.';
    feedback.className = 'form-feedback error';
    return;
  }
  if (newPw !== confPw) {
    feedback.textContent = 'Les mots de passe ne correspondent pas.';
    feedback.className = 'form-feedback error';
    return;
  }
  if (newPw.length < 8) {
    feedback.textContent = 'Le mot de passe doit faire au moins 8 caractères.';
    feedback.className = 'form-feedback error';
    return;
  }

  openModale('modale-pw');
});

document.getElementById('modale-pw-cancel').addEventListener('click', () => closeModale('modale-pw'));
document.getElementById('modale-pw-confirm').addEventListener('click', () => {
  closeModale('modale-pw');
  const feedback = document.getElementById('pw-feedback');
  // TODO Firebase : firebase.auth().currentUser.updatePassword(newPw)
  feedback.textContent = '✓ Mot de passe mis à jour (Firebase requis).';
  feedback.className = 'form-feedback success';
  document.getElementById('compte-pw-old').value = '';
  document.getElementById('compte-pw-new').value = '';
  document.getElementById('compte-pw-confirm').value = '';
  setTimeout(() => feedback.textContent = '', 3000);
});


/* ═══════════════════════════════════════════
   MON COMPTE — EMAIL & TÉL (OTP)
   UI complète — envoi réel requis Firebase
═══════════════════════════════════════════ */
let otpContext = null; // 'email' ou 'tel'
let otpChannel = null; // 'sms' ou 'email'
let otpCode    = null; // code généré côté client (temporaire)

function openOtpFlow(context) {
  otpContext = context;
  otpChannel = null;
  otpCode    = null;

  // Reset
  document.getElementById('otp-step-1').classList.remove('hidden');
  document.getElementById('otp-step-2').classList.add('hidden');
  document.querySelectorAll('.otp-digit').forEach(d => d.value = '');
  document.getElementById('otp-feedback').textContent = '';

  const title = context === 'email' ? 'Changer l\'e-mail' : 'Changer le téléphone';
  document.getElementById('otp-title').textContent = title;
  document.getElementById('otp-intro').textContent =
    'Choisissez comment recevoir votre code de vérification à 6 chiffres.';

  openModale('modale-otp');
}

// Boutons ouvrir OTP
document.getElementById('btn-change-email').addEventListener('click', () => {
  const email = document.getElementById('compte-email').value.trim();
  if (!email) {
    const fb = document.getElementById('email-feedback');
    fb.textContent = 'Entrez la nouvelle adresse e-mail.';
    fb.className = 'form-feedback error';
    return;
  }
  openOtpFlow('email');
});

document.getElementById('btn-change-tel').addEventListener('click', () => {
  const tel = document.getElementById('compte-tel').value.trim();
  if (!tel) {
    const fb = document.getElementById('tel-feedback');
    fb.textContent = 'Entrez le nouveau numéro.';
    fb.className = 'form-feedback error';
    return;
  }
  openOtpFlow('tel');
});

// Choix canal
document.getElementById('otp-by-sms').addEventListener('click', () => sendOtp('sms'));
document.getElementById('otp-by-email').addEventListener('click', () => sendOtp('email'));

function sendOtp(channel) {
  otpChannel = channel;
  // Génère un code 6 chiffres temporaire (côté client, pour la démo)
  otpCode = String(Math.floor(100000 + Math.random() * 900000));
  console.log('Code OTP (démo) :', otpCode); // À retirer en prod

  const dest = channel === 'sms' ? 'votre téléphone' : 'votre adresse e-mail';
  document.getElementById('otp-sent-to').textContent = `Un code a été envoyé par ${channel === 'sms' ? 'SMS à' : 'e-mail à'} ${dest}.`;

  // TODO Firebase :
  // - SMS  → firebase phone auth ou Twilio via Cloud Function
  // - Mail → firebase.auth().sendEmailVerification() ou nodemailer via Cloud Function

  document.getElementById('otp-step-1').classList.add('hidden');
  document.getElementById('otp-step-2').classList.remove('hidden');

  // Focus premier champ
  setTimeout(() => document.querySelector('.otp-digit').focus(), 80);
}

// Navigation entre les digits OTP
document.querySelectorAll('.otp-digit').forEach((input, i, all) => {
  input.addEventListener('input', () => {
    input.value = input.value.replace(/\D/g, '').slice(0, 1);
    if (input.value && i < all.length - 1) all[i + 1].focus();
  });
  input.addEventListener('keydown', e => {
    if (e.key === 'Backspace' && !input.value && i > 0) all[i - 1].focus();
  });
});

// Retour étape 1
document.getElementById('otp-back').addEventListener('click', () => {
  document.getElementById('otp-step-1').classList.remove('hidden');
  document.getElementById('otp-step-2').classList.add('hidden');
  document.getElementById('otp-feedback').textContent = '';
});

// Valider le code
document.getElementById('otp-validate').addEventListener('click', () => {
  const entered = [...document.querySelectorAll('.otp-digit')].map(d => d.value).join('');
  const feedback = document.getElementById('otp-feedback');

  if (entered.length < 6) {
    feedback.textContent = 'Entrez les 6 chiffres du code.';
    feedback.className = 'form-feedback error';
    return;
  }

  // Vérification temporaire côté client
  // En prod : vérification côté Firebase / Cloud Function
  if (entered === otpCode) {
    closeModale('modale-otp');

    if (otpContext === 'email') {
      const fb = document.getElementById('email-feedback');
      // TODO Firebase : firebase.auth().currentUser.updateEmail(newEmail)
      fb.textContent = '✓ E-mail mis à jour (Firebase requis).';
      fb.className = 'form-feedback success';
      document.getElementById('compte-email').value = '';
      setTimeout(() => fb.textContent = '', 3000);
    } else {
      const fb = document.getElementById('tel-feedback');
      // TODO Firebase : mettre à jour dans Firestore
      fb.textContent = '✓ Téléphone mis à jour (Firebase requis).';
      fb.className = 'form-feedback success';
      document.getElementById('compte-tel').value = '';
      setTimeout(() => fb.textContent = '', 3000);
    }
  } else {
    feedback.textContent = 'Code incorrect. Vérifiez et réessayez.';
    feedback.className = 'form-feedback error';
    document.querySelectorAll('.otp-digit').forEach(d => d.value = '');
    document.querySelector('.otp-digit').focus();
  }
});

// Fermer modale OTP
document.getElementById('modale-otp-close').addEventListener('click', () => closeModale('modale-otp'));