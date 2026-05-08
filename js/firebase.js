/* ═══════════════════════════════════════════
   FINNEGAN'S — SITE PUBLIC firebase.js
   Charge les données depuis Firestore
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
   1. CHARGER LES CATÉGORIES + ARTICLES
═══════════════════════════════════════════ */
async function loadCarte() {
  try {
    // 1. Charger les catégories
    const catSnap = await getDocs(query(collection(db, 'categories'), orderBy('nom')));
    const categories = catSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    // 2. Charger les articles
    const artSnap = await getDocs(collection(db, 'articles'));
    const articles = artSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    // 3. Grouper par catégorie
    const sections = {
      'bieres':       { el: document.getElementById('bieres'),       articles: [] },
      'cocktails':     { el: document.getElementById('cocktails'),     articles: [] },
      'softs':        { el: document.getElementById('softs'),        articles: [] },
      'restauration': { el: document.getElementById('restauration'), articles: [] }
    };

    // Associer chaque article à sa section via le nom de la catégorie
    articles.forEach(article => {
      const cat = categories.find(c => c.id === article.categorieId);
      if (!cat) return;

      const catNom = cat.nom.toLowerCase();
      if (catNom.includes('bière') || catNom.includes('biere') || catNom.includes('pression') || catNom.includes('bouteille')) {
        sections['bieres'].articles.push(article);
      } else if (catNom.includes('cocktail') || catNom.includes('drink')) {
        sections['cocktails'].articles.push(article);
      } else if (catNom.includes('soft') || catNom.includes('soda') || catNom.includes('jus') || catNom.includes('chaud') || catNom.includes('boisson')) {
        sections['softs'].articles.push(article);
      } else if (catNom.includes('restauration') || catNom.includes('plat') || catNom.includes('burger') || catNom.includes('entrée') || catNom.includes('dessert') || catNom.includes('salade') || catNom.includes('soupe')) {
        sections['restauration'].articles.push(article);
      }
    });

    // 4. Remplacer le contenu des sections qui ont des articles
    Object.values(sections).forEach(section => {
      if (section.articles.length === 0) return; // Garde le HTML statique si vide

      const container = section.el.querySelector('.drinks-grid, .menu-grid');
      if (!container) return;

      container.innerHTML = '';

      section.articles.forEach(article => {
        // Utiliser le composant drink-card pour les bières et cocktails
        if (section.el.id === 'bieres' || section.el.id === 'cocktails') {
          const card = document.createElement('article');
          card.className = 'drink-card reveal';
          card.innerHTML = `
            <div class="drink-img-wrap">
              <img src="https://images.unsplash.com/photo-1608270586620-248524c67de9?w=600&q=80" alt="${article.nom}" loading="lazy" />
            </div>
            <div class="drink-info">
              <h3>${article.nom}</h3>
              <p class="drink-origin">${article.description || ''}</p>
              <ul class="drink-variants">
                ${(article.variantes || []).map(v => `
                  <li><span>${v.label}</span><span class="price">${v.price}</span></li>
                `).join('')}
              </ul>
            </div>
          `;
          container.appendChild(card);

        } else {
          // Pour softs et restauration, format menu-list
          const catDiv = document.createElement('div');
          catDiv.className = 'menu-category reveal';
          catDiv.innerHTML = `
            <h3 class="menu-cat-title">${article.nom}</h3>
            <ul class="menu-list">
              ${(article.variantes || []).map(v => `
                <li><span>${v.label}</span><span class="price">${v.price}</span></li>
              `).join('')}
            </ul>
          `;
          container.appendChild(catDiv);
        }
      });
    });

    // Réinitialiser les animations GSAP/IntersectionObserver pour les nouveaux éléments
    document.querySelectorAll('.reveal').forEach(el => {
      el.classList.remove('visible');
      // L'IntersectionObserver existant dans scripts.js les réobservera automatiquement car ils sont déjà dans le DOM
    });

  } catch (err) {
    console.error('Erreur chargement carte :', err);
  }
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

    // Mettre à jour le contenu
    const titreEl = popup.querySelector('.popup-body h2');
    const descEl  = popup.querySelector('.popup-desc');
    const imgEl   = popup.querySelector('.popup-img-wrap img');
    const labelEl = popup.querySelector('.popup-label');

    if (titreEl && data.titre) titreEl.textContent = data.titre;
    if (descEl && data.description) descEl.textContent = data.description;
    if (labelEl) labelEl.textContent = 'Événement à venir';

    // Afficher
    popup.classList.remove('popup-hidden');

    // Fermeture
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
   INIT — TOUT CHARGER
═══════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  loadCarte();
  loadEvenements();
  loadInfos();
  loadPopup();
});