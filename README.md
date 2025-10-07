# Site de Myriam Frolla — Autrice jeunesse

Site statique Tailwind (CDN) avec pages Accueil, Livres, À propos, Ateliers et Contact.

## Aperçu rapide
- Pages: `index.html`, `livres.html`, `bio.html`, `ateliers.html`, `contact.html`
- JS: `assets/js/main.js` (menu mobile, thème sombre, fade-in, slider, filtres livres, formulaires)
- Données livres: `assets/data/books.json` (Amazon) et `assets/data/books_gbooks.json` (Google Books)

## Lancer en local
Ouvrir `index.html` directement fonctionne, mais pour le chargement dynamique des livres (fetch JSON), servez en local:

- Python: `python -m http.server 8080` puis http://localhost:8080
- VS Code: extension “Live Server”

## Personnalisation
- Nom affiché: chercher “Myriam Frolla” dans les fichiers HTML
- E‑mail contact: `contact.html` et `assets/js/main.js`
- Réseaux sociaux: liens dans les pieds de page + `contact.html`
- Couvertures: placez des images en HD dans `assets/covers/` et remplacez les URLs (ou laissez Google Books)

## Déploiement GitHub Pages
1) Poussez le dépôt sur GitHub
2) Réglages du repo → Pages → “Déployer depuis” `main` / `/ (root)`
3) L’URL sera `https://<votre-user>.github.io/<repo>/`

## Scripts/Build
Pas de build: Tailwind via CDN. Si besoin d’un build local Tailwind, créez un `tailwind.config.js` et une feuille CSS compilée.

