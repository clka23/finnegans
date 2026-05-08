/* ═══════════════════════════════════════════
   FINNEGAN'S — SITE PUBLIC firebase.js
   Système de carte 100% dynamique basé sur les catégories Firebase
═══════════════════════════════════════════ */

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
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

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);


/* ═══════════════════════════════════════════
   IMAGES PAR DÉFAUT POUR LES CATÉGORIES
═══════════════════════════════════════════ */
const defaultImages = {
  tile: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&q=80',
  article: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=600&q=80'
};


/* ═══════════════════════════════════════════
   1. CHARGER LES CATÉGORIES + ARTICLES
═══════════════════════════════════════════ */
async function loadCarte() {
  try {
    // 1. Charger les catégories
    const catSnap = await getDocs(collection(db, 'categories'));
    let categories = catSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Trier par ordre (si présent), sinon alphabétique
    categories.sort((a, b) => {
      if (a.ordre !== undefined && b.ordre !== undefined) {
        return a.ordre - b.ordre;
      }
      if (a.ordre !== undefined) return -1;
      if (b.ordre !== undefined) return 1;
      return a.nom.localeCompare(b.nom);
    });

    // 2. Charger les articles
    const artSnap = await getDocs(collection(db, 'articles'));
    const articles = artSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    // 3. Générer les tuiles de catégories
    generateCategoryTiles(categories);

    // 4. Générer le menu hamburger
    generateNavMenu(categories);

    // 5. Générer les sections dynamiques avec articles
    generateDynamicSections(categories, articles);

    // 6. Réinitialiser les observers pour les animations
    reinitObservers();

  } catch (err) {
    console.error('Erreur chargement carte :', err);
  }
}


/* ═══════════════════════════════════════════
   GÉNÉRER LES TUILES DE CATÉGORIES
═══════════════════════════════════════════ */
function generateCategoryTiles(categories) {
  const container = document.getElementById('categories-tiles');
  if (!container) return;

  container.innerHTML = '';

  categories.forEach(cat => {
    const tile = document.createElement('a');
    tile.href = `#cat-${cat.id}`;
    tile.className = 'tile reveal';
    tile.innerHTML = `
      <div class="tile-bg" style="background-image:url('${defaultImages.tile}')"></div>
      <div class="tile-overlay"></div>
      <div class="tile-content">
        <h3>${cat.nom}</h3>
        <p>Découvrez notre sélection</p>
      </div>
    `;
    container.appendChild(tile);
  });
}


/* ═══════════════════════════════════════════
   GÉNÉRER LE MENU HAMBURGER
═══════════════════════════════════════════ */
function generateNavMenu(categories) {
  const navLinks = document.getElementById('nav-links');
  if (!navLinks) return;

  // Retirer les anciens liens de catégories (garder Événements et Infos)
  const existingLinks = Array.from(navLinks.querySelectorAll('li'));
  const keepLinks = existingLinks.filter(li => {
    const href = li.querySelector('a')?.getAttribute('href');
    return href === '#evenements' || href === '#infos';
  });

  navLinks.innerHTML = '';

  // Ajouter les catégories
  categories.forEach(cat => {
    const li = document.createElement('li');
    li.innerHTML = `<a href="#cat-${cat.id}">${cat.nom}</a>`;
    navLinks.appendChild(li);
  });

  // Rajouter Événements et Infos à la fin
  keepLinks.forEach(li => navLinks.appendChild(li));
}


/* ═══════════════════════════════════════════
   GÉNÉRER LES SECTIONS DYNAMIQUES
═══════════════════════════════════════════ */
function generateDynamicSections(categories, articles) {
  const container = document.getElementById('dynamic-sections');
  if (!container) return;

  container.innerHTML = '';

  categories.forEach(cat => {
    // Filtrer les articles de cette catégorie
    const catArticles = articles.filter(a => a.categorieId === cat.id);

    if (catArticles.length === 0) return; // Ne pas créer de section vide

    // Créer la section
    const section = document.createElement('section');
    section.id = `cat-${cat.id}`;
    section.innerHTML = `
      <div class="section-header reveal">
        <span class="section-label">Notre sélection</span>
        <h2>${cat.nom}</h2>
        <div class="section-divider"></div>
      </div>
      <div class="drinks-grid" data-category="${cat.id}"></div>
    `;

    const grid = section.querySelector('.drinks-grid');

    // Ajouter les articles
    catArticles.forEach(article => {
      const card = document.createElement('article');
      card.className = 'drink-card reveal';
      card.innerHTML = `
        <div class="drink-img-wrap">
          <img src="${article.imageUrl || defaultImages.article}" alt="${article.nom}" loading="lazy" />
        </div>
        <div class="drink-info">
          <h3>${article.nom}</h3>
          ${article.description ? `<p class="drink-origin">${article.description}</p>` : ''}
          <ul class="drink-variants">
            ${(article.variantes || []).map(v => `
              <li><span>${v.label}</span><span class="price">${v.price}</span></li>
            `).join('')}
          </ul>
        </div>
      `;
      grid.appendChild(card);
    });

    container.appendChild(section);
  });
}


/* ═══════════════════════════════════════════
   2. CHARGER LES ÉVÉNEMENTS
═══════════════════════════════════════════ */
async function loadEvenements() {
  try {
    const snap = await getDocs(query(collection(db, 'evenements'), orderBy('date')));
    const container = document.querySelector('#evenements .events-grid');
    if (!container) return;

    container.innerHTML = '';

    if (snap.empty) {
      container.innerHTML = '<p style="text-align:center;opacity:0.5;font-style:italic">Aucun événement à venir pour le moment.</p>';
      return;
    }

    snap.docs.forEach(d => {
      const ev = d.data();
      const article = document.createElement('article');
      article.className = 'event-card reveal';
      article.innerHTML = `
        <div class="event-date">
          <span class="event-day">${ev.jour}</span>
          <span class="event-month">${ev.mois}</span>
        </div>
        <div class="event-body">
          <h3>${ev.titre}</h3>
          <p>${ev.description || ''}</p>
          ${ev.tag ? `<span class="event-tag">${ev.tag}</span>` : ''}
          ${ev.reservation && ev.reservation.active ? `
            <button class="hero-cta" style="margin-top:0.8rem;font-size:0.65rem;padding:0.5rem 1.5rem" 
                    onclick="alert('Réservation pour : ${ev.titre}\\nContactez le pub au 03 84 XX XX XX')">
              Réserver
            </button>
          ` : ''}
        </div>
      `;
      container.appendChild(article);
    });

  } catch (err) {
    console.error('Erreur chargement événements :', err);
  }
}


/* ═══════════════════════════════════════════
   3. CHARGER LES INFOS PRATIQUES
═══════════════════════════════════════════ */
async function loadInfos() {
  try {
    const snap = await getDoc(doc(db, 'config', 'infos'));
    if (!snap.exists()) return;

    const data = snap.data();
    const blocks = document.querySelectorAll('#infos .info-block');

    // Adresse
    if (data.adresse && blocks[0]) {
      blocks[0].querySelector('p').innerHTML = `${data.adresse.rue || ''}<br />${data.adresse.ville || ''}`;
    }

    // Horaires
    if (data.horaires && blocks[1]) {
      const jours = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
      const joursFR = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
      let html = '';
      jours.forEach((j, i) => {
        const h = data.horaires[j];
        if (h && !h.ferme && h.plages && h.plages.length > 0) {
          const plages = h.plages.map(p => `${p.open} – ${p.close}`).join(' / ');
          html += `${joursFR[i]} : ${plages}<br />`;
        } else if (h && h.ferme) {
          html += `${joursFR[i]} : Fermé<br />`;
        }
      });
      blocks[1].querySelector('p').innerHTML = html || 'Horaires non disponibles';
    }

    // Contact
    if (data.contact && blocks[2]) {
      blocks[2].querySelector('p').innerHTML = `${data.contact.tel || ''}<br />${data.contact.email || ''}`;
    }

  } catch (err) {
    console.error('Erreur chargement infos :', err);
  }
}


/* ═══════════════════════════════════════════
   4. CHARGER LA POPUP
═══════════════════════════════════════════ */
async function loadPopup() {
  const popup = document.getElementById('event-popup');
  if (!popup) return;

  try {
    const snap = await getDoc(doc(db, 'config', 'popup'));
    if (!snap.exists()) {
      popup.classList.add('popup-hidden');
      return;
    }

    const data = snap.data();
    if (!data.active) {
      popup.classList.add('popup-hidden');
      return;
    }

    const titreEl = popup.querySelector('.popup-body h2');
    const descEl  = popup.querySelector('.popup-desc');
    const imgEl   = popup.querySelector('.popup-img-wrap img');
    const labelEl = popup.querySelector('.popup-label');

    if (titreEl && data.titre) titreEl.textContent = data.titre;
    if (descEl && data.description) descEl.textContent = data.description;
    if (labelEl) labelEl.textContent = 'Événement à venir';
    if (imgEl && data.imageBase64) imgEl.src = data.imageBase64;

    popup.classList.remove('popup-hidden');

    document.getElementById('popup-close').addEventListener('click', () => {
      popup.classList.add('popup-hidden');
    });
    popup.addEventListener('click', (e) => {
      if (e.target === popup) popup.classList.add('popup-hidden');
    });

  } catch (err) {
    console.error('Erreur chargement popup :', err);
  }
}


/* ═══════════════════════════════════════════
   RÉINITIALISER LES OBSERVERS
═══════════════════════════════════════════ */
function reinitObservers() {
  // Retirer la classe visible de tous les éléments reveal nouvellement créés
  document.querySelectorAll('.reveal').forEach(el => {
    if (!el.closest('#hero')) {
      el.classList.remove('visible');
    }
  });

  // Réappliquer les data-delay pour l'animation échelonnée
  document.querySelectorAll('.drink-card, .menu-category, .event-card, .info-block, .tile').forEach((el, i) => {
    el.dataset.delay = i % 3;
  });

  // Le IntersectionObserver de scripts.js va automatiquement observer ces nouveaux éléments
  // car il observe tous les .reveal au chargement ET après modifications DOM
}


/* ═══════════════════════════════════════════
   INIT — TOUT CHARGER
═══════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', async () => {
  // Force l'affichage immédiat des éléments reveal du hero
  document.querySelectorAll('#hero .reveal').forEach(el => {
    el.classList.add('visible');
  });

  // Charge les données Firebase
  await loadCarte();
  await loadEvenements();
  await loadInfos();
  await loadPopup();

  // Réinitialise les observers après chargement complet
  reinitObservers();
});