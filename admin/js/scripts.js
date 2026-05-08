/* ═══════════════════════════════════════════
   FINNEGAN'S — ADMIN scripts.js v4
   Firebase Auth + Firestore
═══════════════════════════════════════════ */

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updatePassword,
  updateEmail,
  EmailAuthProvider,
  reauthenticateWithCredential
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyClZPF7ESoGwCqdFuBgWXyTcTJva4Y-a7Q",
  authDomain: "finnegans-belfort.firebaseapp.com",
  projectId: "finnegans-belfort",
  storageBucket: "finnegans-belfort.firebasestorage.app",
  messagingSenderId: "675354405806",
  appId: "1:675354405806:web:28f177765a43ba5a6b363f"
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);


/* ═══════════════════════════════════════════
   ANIMATIONS CSS
═══════════════════════════════════════════ */
const adminStyle = document.createElement('style');
adminStyle.textContent = `
  @keyframes fadeOut { to { opacity: 0; pointer-events: none; } }
  @keyframes shake {
    0%,100% { transform:translateX(0); }
    20%      { transform:translateX(-8px); }
    40%      { transform:translateX(8px); }
    60%      { transform:translateX(-5px); }
    80%      { transform:translateX(5px); }
  }
`;
document.head.appendChild(adminStyle);


/* ═══════════════════════════════════════════
   FEATURE FLAG — RÉSERVATION
═══════════════════════════════════════════ */
const FEATURE_RESERVATION = true;


/* ═══════════════════════════════════════════
   ÉLÉMENTS DOM
═══════════════════════════════════════════ */
const loginScreen = document.getElementById('login-screen');
const adminScreen = document.getElementById('admin-screen');
const loginForm   = document.getElementById('login-form');
const loginError  = document.getElementById('login-error');
const togglePw    = document.getElementById('toggle-pw');
const loginPw     = document.getElementById('login-password');
const topbarUser  = document.getElementById('topbar-user');


/* ═══════════════════════════════════════════
   AUTH — ÉTAT DE CONNEXION
═══════════════════════════════════════════ */
onAuthStateChanged(auth, user => {
  if (user) {
    loginScreen.classList.add('hidden');
    loginScreen.style.animation = '';
    adminScreen.classList.remove('hidden');
    topbarUser.textContent = user.email;
    initReservationFeature();
    loadCategories();
    loadEvenements();
    loadArticles(); // ─── AJOUT 1 : Chargement des articles au login ───
  } else {
    adminScreen.classList.add('hidden');
    loginScreen.classList.remove('hidden');
  }
});


/* ═══════════════════════════════════════════
   LOGIN
═══════════════════════════════════════════ */
loginForm.addEventListener('submit', async e => {
  e.preventDefault();
  loginError.textContent = '';

  const email = document.getElementById('login-email').value.trim();
  const pw    = loginPw.value;

  if (!email || !pw) {
    loginError.textContent = 'Veuillez remplir tous les champs.';
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, email, pw);
    loginScreen.style.animation = 'fadeOut 0.4s ease forwards';
  } catch (err) {
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

document.getElementById('btn-logout').addEventListener('click', async () => {
  await signOut(auth);
  loginForm.reset();
  loginError.textContent = '';
});


/* ═══════════════════════════════════════════
   FEATURE FLAG — INIT
═══════════════════════════════════════════ */
function initReservationFeature() {
  document.querySelectorAll('.reservation-block').forEach(b => {
    b.classList.toggle('hidden', !FEATURE_RESERVATION);
  });
}


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
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeAllPanels(); closeAllModales(); }
});


/* ═══════════════════════════════════════════
   MODALES
═══════════════════════════════════════════ */
function openModale(id)  { document.getElementById(id).classList.remove('hidden'); }
function closeModale(id) { document.getElementById(id).classList.add('hidden'); }
function closeAllModales() {
  document.querySelectorAll('.modale-overlay').forEach(m => m.classList.add('hidden'));
}


/* ═══════════════════════════════════════════
   CARTE — CATÉGORIES
═══════════════════════════════════════════ */
let categories    = [];
let renamingCatId = null;

async function loadCategories() {
  try {
    const snap = await getDocs(query(collection(db, 'categories'), orderBy('nom')));
    categories = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderCategories();
  } catch (err) {
    console.error('Erreur chargement catégories :', err);
  }
}

function renderCategories() {
  const list   = document.getElementById('categories-list');
  const select = document.getElementById('article-cat');

  list.innerHTML   = '';
  select.innerHTML = '';

  categories.forEach(cat => {
    const tag = document.createElement('div');
    tag.className = 'tag-item';
    tag.innerHTML = `
      <span class="tag-name" title="Renommer" data-id="${cat.id}">${cat.nom}</span>
      <button class="tag-btn" title="Supprimer" data-id="${cat.id}">✕</button>
    `;
    list.appendChild(tag);

    const opt = document.createElement('option');
    opt.value = cat.id;
    opt.textContent = cat.nom;
    select.appendChild(opt);
  });

  list.querySelectorAll('.tag-name').forEach(el => {
    el.addEventListener('click', () => {
      renamingCatId = el.dataset.id;
      const cat = categories.find(c => c.id === renamingCatId);
      document.getElementById('rename-cat-input').value = cat?.nom || '';
      openModale('modale-rename-cat');
      setTimeout(() => document.getElementById('rename-cat-input').focus(), 100);
    });
  });

  list.querySelectorAll('.tag-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id  = btn.dataset.id;
      const cat = categories.find(c => c.id === id);
      if (!confirm(`Supprimer la catégorie "${cat?.nom}" et TOUT son contenu ?`)) return;
      try {
        await deleteDoc(doc(db, 'categories', id));
        await loadCategories();
        await loadArticles(); // ─── AJOUT 2 : Rafraîchir les articles si on supprime une catégorie
      } catch (err) {
        console.error('Erreur suppression catégorie :', err);
      }
    });
  });
}

document.getElementById('btn-add-cat').addEventListener('click', async () => {
  const input = document.getElementById('new-cat-input');
  const val   = input.value.trim();
  if (!val) return;
  if (categories.some(c => c.nom.toLowerCase() === val.toLowerCase())) {
    input.style.borderColor = '#e57373';
    setTimeout(() => input.style.borderColor = '', 1200);
    return;
  }
  try {
    await addDoc(collection(db, 'categories'), { nom: val });
    input.value = '';
    await loadCategories();
  } catch (err) {
    console.error('Erreur ajout catégorie :', err);
  }
});

document.getElementById('new-cat-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('btn-add-cat').click();
});

document.getElementById('rename-cat-confirm').addEventListener('click', async () => {
  const newName = document.getElementById('rename-cat-input').value.trim();
  if (!newName || !renamingCatId) return;
  try {
    await updateDoc(doc(db, 'categories', renamingCatId), { nom: newName });
    await loadCategories();
    closeModale('modale-rename-cat');
    renamingCatId = null;
  } catch (err) {
    console.error('Erreur renommage catégorie :', err);
  }
});

document.getElementById('rename-cat-cancel').addEventListener('click', () => closeModale('modale-rename-cat'));
document.getElementById('modale-rename-close').addEventListener('click', () => closeModale('modale-rename-cat'));
document.getElementById('rename-cat-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('rename-cat-confirm').click();
});


/* ═══════════════════════════════════════════
   CARTE — ARTICLES
═══════════════════════════════════════════ */
// ─── AJOUT 3 : La fonction loadArticles() en entier ───
async function loadArticles() {
  try {
    const snap = await getDocs(query(collection(db, 'articles'), orderBy('createdAt', 'desc')));
    const container = document.getElementById('articles-display'); // Vérifie que cet ID existe bien dans ton HTML
    if (!container) return;
    
    container.innerHTML = '';

    if (snap.empty) {
      container.innerHTML = '<p class="panel-placeholder">Aucun article enregistré.</p>';
      return;
    }

    categories.forEach(cat => {
      const catArticles = snap.docs.filter(d => d.data().categorieId === cat.id);
      if (catArticles.length > 0) {
        const section = document.createElement('div');
        section.className = 'article-group';
        section.innerHTML = `<h4 style="color:var(--gold); margin: 1.5rem 0 0.8rem 0; font-size:0.85rem; border-bottom:1px solid rgba(201,168,76,0.2); padding-bottom:4px;">${cat.nom}</h4>`;
        
        catArticles.forEach(d => {
          const art = d.data();
          const item = document.createElement('div');
          item.className = 'article-item-row';
          item.style = "display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.03); padding:0.6rem; margin-bottom:0.4rem; border-radius:4px;";
          const prixTxt = art.variantes && art.variantes.length > 0 ? art.variantes[0].price : '0';
          item.innerHTML = `
            <div style="flex:1">
              <div style="font-weight:600; font-size:0.9rem;">${art.nom}</div>
              <div style="font-size:0.75rem; opacity:0.6;">${prixTxt}</div>
            </div>
            <button class="tag-btn" data-id="${d.id}" title="Supprimer">✕</button>
          `;
          item.querySelector('button').addEventListener('click', async () => {
             if (confirm(`Supprimer l'article "${art.nom}" ?`)) {
               await deleteDoc(doc(db, 'articles', d.id));
               loadArticles();
             }
          });
          section.appendChild(item);
        });
        container.appendChild(section);
      }
    });
  } catch (err) {
    console.error('Erreur chargement articles :', err);
  }
}
// ──────────────────────────────────────────────────────

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
addVariante();

document.getElementById('btn-save-article').addEventListener('click', async () => {
  const feedback = document.getElementById('article-feedback');
  const nom   = document.getElementById('article-nom').value.trim();
  const catId = document.getElementById('article-cat').value;
  const desc  = document.getElementById('article-desc').value.trim();

  const variantes = [];
  document.querySelectorAll('.variante-row').forEach(row => {
    const l = row.querySelector('.v-label').value.trim();
    const p = row.querySelector('.v-price').value.trim();
    if (l && p) variantes.push({ label: l, price: p });
  });

  if (!nom || !catId) {
    feedback.textContent = 'Le nom et la catégorie sont obligatoires.';
    feedback.className = 'form-feedback error';
    return;
  }

  try {
    await addDoc(collection(db, 'articles'), {
      categorieId: catId,
      nom,
      description: desc,
      variantes,
      createdAt: new Date()
    });
    feedback.textContent = '✓ Article ajouté.';
    feedback.className = 'form-feedback success';
    document.getElementById('article-nom').value  = '';
    document.getElementById('article-desc').value = '';
    document.getElementById('variantes-list').innerHTML = '';
    addVariante();
    loadArticles(); // ─── AJOUT 4 : Actualiser l'affichage après un ajout ───
    setTimeout(() => feedback.textContent = '', 3000);
  } catch (err) {
    feedback.textContent = 'Erreur lors de l\'ajout.';
    feedback.className = 'form-feedback error';
    console.error(err);
  }
});


/* ═══════════════════════════════════════════
   ÉVÉNEMENTS
═══════════════════════════════════════════ */
const eventDateInput = document.getElementById('event-date');
const today = new Date().toISOString().split('T')[0];
eventDateInput.setAttribute('min', today);

const eventResaToggle  = document.getElementById('event-resa-active');
const eventResaPaid    = document.getElementById('event-resa-paid');
const eventResaOptions = document.getElementById('event-resa-options');

eventResaToggle.addEventListener('change', () => {
  eventResaOptions.classList.toggle('hidden', !eventResaToggle.checked);
  if (!eventResaToggle.checked) eventResaPaid.checked = false;
});

eventResaPaid.addEventListener('change', () => {
  if (eventResaPaid.checked && !eventResaToggle.checked) {
    eventResaToggle.checked = true;
    eventResaOptions.classList.remove('hidden');
  }
});

async function loadEvenements() {
  try {
    const snap = await getDocs(query(collection(db, 'evenements'), orderBy('date')));
    const list = document.querySelector('#panel-evenements .panel-section:last-child');
    list.innerHTML = '<h4>Événements enregistrés</h4>';

    if (snap.empty) {
      list.innerHTML += '<p class="panel-placeholder">Aucun événement enregistré.</p>';
      return;
    }

    snap.docs.forEach(d => {
      const ev  = d.data();
      const div = document.createElement('div');
      div.className = 'event-item';
      div.innerHTML = `
        <div class="event-item-info">
          <span class="event-item-date">${ev.jour} ${ev.mois}</span>
          <span class="event-item-titre">${ev.titre}</span>
          ${ev.tag ? `<span class="event-item-tag">${ev.tag}</span>` : ''}
        </div>
        <button class="tag-btn" data-id="${d.id}" title="Supprimer">✕</button>
      `;
      div.querySelector('.tag-btn').addEventListener('click', async () => {
        if (!confirm(`Supprimer l'événement "${ev.titre}" ?`)) return;
        await deleteDoc(doc(db, 'evenements', d.id));
        await loadEvenements();
      });
      list.appendChild(div);
    });
  } catch (err) {
    console.error('Erreur chargement événements :', err);
  }
}

document.getElementById('btn-save-event').addEventListener('click', async () => {
  const feedback = document.getElementById('event-feedback');
  const date  = document.getElementById('event-date').value;
  const titre = document.getElementById('event-titre').value.trim();
  const desc  = document.getElementById('event-desc').value.trim();
  const tag   = document.getElementById('event-tag').value.trim();

  const resaActive = FEATURE_RESERVATION && eventResaToggle.checked;
  const resaPaid   = FEATURE_RESERVATION && eventResaPaid.checked;
  const resaMax    = resaActive ? parseInt(document.getElementById('event-resa-max').value) || 0 : 0;

  if (!date || !titre) {
    feedback.textContent = 'La date et le titre sont obligatoires.';
    feedback.className = 'form-feedback error';
    return;
  }

  if (resaActive && resaMax <= 0) {
    feedback.textContent = 'Indiquez un nombre maximum de réservations.';
    feedback.className = 'form-feedback error';
    return;
  }

  const d      = new Date(date + 'T00:00:00');
  const jour   = d.getDate();
  const mois   = d.toLocaleString('fr-FR', { month: 'long' });
  const moisCap = mois.charAt(0).toUpperCase() + mois.slice(1);

  try {
    await addDoc(collection(db, 'evenements'), {
      date, jour, mois: moisCap, titre,
      description: desc, tag,
      reservation: { active: resaActive, paid: resaPaid, max: resaMax, count: 0 },
      createdAt: new Date()
    });

    feedback.textContent = '✓ Événement ajouté.';
    feedback.className = 'form-feedback success';

    document.getElementById('event-date').value  = '';
    document.getElementById('event-titre').value = '';
    document.getElementById('event-desc').value  = '';
    document.getElementById('event-tag').value   = '';
    eventResaToggle.checked = false;
    eventResaPaid.checked   = false;
    eventResaOptions.classList.add('hidden');
    document.getElementById('event-resa-max').value = '';

    await loadEvenements();
    setTimeout(() => feedback.textContent = '', 3000);
  } catch (err) {
    feedback.textContent = 'Erreur lors de l\'ajout.';
    feedback.className = 'form-feedback error';
    console.error(err);
  }
});


/* ═══════════════════════════════════════════
   POPUP — UPLOAD IMAGE
═══════════════════════════════════════════ */
const popupImgInput     = document.getElementById('popup-img-input');
const uploadZone        = document.getElementById('upload-zone');
const uploadPlaceholder = document.getElementById('upload-placeholder');
const uploadImgPreview  = document.getElementById('upload-img-preview');
const uploadRemoveBtn   = document.getElementById('upload-remove');

document.getElementById('upload-btn').addEventListener('click', () => popupImgInput.click());
uploadPlaceholder.addEventListener('click', () => popupImgInput.click());

popupImgInput.addEventListener('change', () => {
  const file = popupImgInput.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) { alert('Image trop lourde. Maximum : 5 Mo.'); return; }
  const reader = new FileReader();
  reader.onload = e => {
    uploadImgPreview.src = e.target.result;
    uploadImgPreview.classList.remove('hidden');
    uploadPlaceholder.classList.add('hidden');
    uploadRemoveBtn.classList.remove('hidden');
  };
  reader.readAsDataURL(file);
});

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

const popupResaToggle  = document.getElementById('popup-resa-active');
const popupResaPaid    = document.getElementById('popup-resa-paid');
const popupResaOptions = document.getElementById('popup-resa-options');

popupResaToggle.addEventListener('change', () => {
  popupResaOptions.classList.toggle('hidden', !popupResaToggle.checked);
  if (!popupResaToggle.checked) popupResaPaid.checked = false;
});

popupResaPaid.addEventListener('change', () => {
  if (popupResaPaid.checked && !popupResaToggle.checked) {
    popupResaToggle.checked = true;
    popupResaOptions.classList.remove('hidden');
  }
});

document.getElementById('btn-save-popup').addEventListener('click', async () => {
  const feedback   = document.getElementById('popup-feedback');
  const titre      = document.getElementById('popup-titre').value.trim();
  const desc       = document.getElementById('popup-desc').value.trim();
  const active     = document.getElementById('popup-active').checked;
  const resaActive = FEATURE_RESERVATION && popupResaToggle.checked;
  const resaPaid   = FEATURE_RESERVATION && popupResaPaid.checked;
  const resaMax    = resaActive ? parseInt(document.getElementById('popup-resa-max').value) || 0 : 0;

  if (resaActive && resaMax <= 0) {
    feedback.textContent = 'Indiquez un nombre maximum de réservations.';
    feedback.className = 'form-feedback error';
    return;
  }

  try {
    await setDoc(doc(db, 'config', 'popup'), {
      active, titre, description: desc,
      reservation: { active: resaActive, paid: resaPaid, max: resaMax },
      updatedAt: new Date()
    });
    feedback.textContent = '✓ Popup enregistrée.';
    feedback.className = 'form-feedback success';
    setTimeout(() => feedback.textContent = '', 3000);
  } catch (err) {
    feedback.textContent = 'Erreur lors de l\'enregistrement.';
    feedback.className = 'form-feedback error';
    console.error(err);
  }
});


/* ═══════════════════════════════════════════
   HORAIRES
═══════════════════════════════════════════ */
const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

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
    const id    = jour.toLowerCase();
    const block = document.createElement('div');
    block.className  = 'horaire-day';
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
    block.querySelector('.closed-cb').addEventListener('change', function() {
      block.classList.toggle('is-closed', this.checked);
    });
    grid.appendChild(block);
  });
}

buildHorairesGrid();

document.getElementById('btn-save-infos').addEventListener('click', async () => {
  const feedback = document.getElementById('infos-feedback');
  const rue   = document.getElementById('infos-rue').value.trim();
  const ville = document.getElementById('infos-ville').value.trim();
  const tel   = document.getElementById('infos-tel').value.trim();
  const email = document.getElementById('infos-email').value.trim();

  const horaires = {};
  JOURS.forEach(jour => {
    const id    = jour.toLowerCase();
    const block = document.querySelector(`.horaire-day[data-jour="${id}"]`);
    const ferme = block.querySelector('.closed-cb').checked;
    const data  = { ferme, plages: [] };
    block.querySelectorAll('.horaire-plage').forEach(p => {
      const open  = p.querySelector('.h-open').value;
      const close = p.querySelector('.h-close').value;
      if (open && close) data.plages.push({ open, close });
    });
    horaires[id] = data;
  });

  try {
    await setDoc(doc(db, 'config', 'infos'), {
      adresse: { rue, ville },
      horaires,
      contact: { tel, email },
      updatedAt: new Date()
    });
    feedback.textContent = '✓ Infos enregistrées.';
    feedback.className = 'form-feedback success';
    setTimeout(() => feedback.textContent = '', 3000);
  } catch (err) {
    feedback.textContent = 'Erreur lors de l\'enregistrement.';
    feedback.className = 'form-feedback error';
    console.error(err);
  }
});


/* ═══════════════════════════════════════════
   MON COMPTE — MOT DE PASSE
═══════════════════════════════════════════ */
document.getElementById('btn-change-pw').addEventListener('click', () => {
  const feedback = document.getElementById('pw-feedback');
  const oldPw    = document.getElementById('compte-pw-old').value;
  const newPw    = document.getElementById('compte-pw-new').value;
  const confPw   = document.getElementById('compte-pw-confirm').value;

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
document.getElementById('modale-pw-confirm').addEventListener('click', async () => {
  closeModale('modale-pw');
  const feedback = document.getElementById('pw-feedback');
  const user     = auth.currentUser;
  const oldPw    = document.getElementById('compte-pw-old').value;
  const newPw    = document.getElementById('compte-pw-new').value;

  try {
    const credential = EmailAuthProvider.credential(user.email, oldPw);
    await reauthenticateWithCredential(user, credential);
    await updatePassword(user, newPw);
    feedback.textContent = '✓ Mot de passe mis à jour.';
    feedback.className = 'form-feedback success';
    document.getElementById('compte-pw-old').value     = '';
    document.getElementById('compte-pw-new').value     = '';
    document.getElementById('compte-pw-confirm').value = '';
    setTimeout(() => feedback.textContent = '', 3000);
  } catch (err) {
    feedback.textContent = 'Erreur : mot de passe actuel incorrect.';
    feedback.className = 'form-feedback error';
    console.error(err);
  }
});


/* ═══════════════════════════════════════════
   MON COMPTE — EMAIL & TÉL (OTP)
═══════════════════════════════════════════ */
let otpContext = null;
let otpChannel = null;
let otpCode    = null;

function openOtpFlow(context) {
  otpContext = context;
  otpChannel = null;
  otpCode    = null;
  document.getElementById('otp-step-1').classList.remove('hidden');
  document.getElementById('otp-step-2').classList.add('hidden');
  document.querySelectorAll('.otp-digit').forEach(d => d.value = '');
  document.getElementById('otp-feedback').textContent = '';
  document.getElementById('otp-title').textContent =
    context === 'email' ? "Changer l'e-mail" : 'Changer le téléphone';
  document.getElementById('otp-intro').textContent =
    'Choisissez comment recevoir votre code de vérification à 6 chiffres.';
  openModale('modale-otp');
}

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

document.getElementById('otp-by-sms').addEventListener('click', () => sendOtp('sms'));
document.getElementById('otp-by-email').addEventListener('click', () => sendOtp('email'));

function sendOtp(channel) {
  otpChannel = channel;
  otpCode    = String(Math.floor(100000 + Math.random() * 900000));
  console.log('Code OTP (démo) :', otpCode);
  const dest = channel === 'sms' ? 'votre téléphone' : 'votre adresse e-mail';
  document.getElementById('otp-sent-to').textContent =
    `Un code a été envoyé par ${channel === 'sms' ? 'SMS à' : 'e-mail à'} ${dest}.`;
  document.getElementById('otp-step-1').classList.add('hidden');
  document.getElementById('otp-step-2').classList.remove('hidden');
  setTimeout(() => document.querySelector('.otp-digit').focus(), 80);
}

document.querySelectorAll('.otp-digit').forEach((input, i, all) => {
  input.addEventListener('input', () => {
    input.value = input.value.replace(/\D/g, '').slice(0, 1);
    if (input.value && i < all.length - 1) all[i + 1].focus();
  });
  input.addEventListener('keydown', e => {
    if (e.key === 'Backspace' && !input.value && i > 0) all[i - 1].focus();
  });
});

document.getElementById('otp-back').addEventListener('click', () => {
  document.getElementById('otp-step-1').classList.remove('hidden');
  document.getElementById('otp-step-2').classList.add('hidden');
  document.getElementById('otp-feedback').textContent = '';
});

document.getElementById('otp-validate').addEventListener('click', async () => {
  const entered  = [...document.querySelectorAll('.otp-digit')].map(d => d.value).join('');
  const feedback = document.getElementById('otp-feedback');

  if (entered.length < 6) {
    feedback.textContent = 'Entrez les 6 chiffres du code.';
    feedback.className = 'form-feedback error';
    return;
  }

  if (entered === otpCode) {
    closeModale('modale-otp');
    if (otpContext === 'email') {
      const fb      = document.getElementById('email-feedback');
      const newEmail = document.getElementById('compte-email').value.trim();
      try {
        await updateEmail(auth.currentUser, newEmail);
        fb.textContent = '✓ E-mail mis à jour.';
        fb.className = 'form-feedback success';
        document.getElementById('compte-email').value = '';
        setTimeout(() => fb.textContent = '', 3000);
      } catch (err) {
        fb.textContent = 'Erreur lors de la mise à jour.';
        fb.className = 'form-feedback error';
        console.error(err);
      }
    } else {
      const fb  = document.getElementById('tel-feedback');
      const tel = document.getElementById('compte-tel').value.trim();
      try {
        await setDoc(doc(db, 'config', 'compte'), { tel }, { merge: true });
        fb.textContent = '✓ Téléphone mis à jour.';
        fb.className = 'form-feedback success';
        document.getElementById('compte-tel').value = '';
        setTimeout(() => fb.textContent = '', 3000);
      } catch (err) {
        fb.textContent = 'Erreur lors de la mise à jour.';
        fb.className = 'form-feedback error';
        console.error(err);
      }
    }
  } else {
    feedback.textContent = 'Code incorrect. Vérifiez et réessayez.';
    feedback.className = 'form-feedback error';
    document.querySelectorAll('.otp-digit').forEach(d => d.value = '');
    document.querySelector('.otp-digit').focus();
  }
});

document.getElementById('modale-otp-close').addEventListener('click', () => closeModale('modale-otp'));