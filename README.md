# Zenith

Navigateur web minimaliste construit avec Electron.

![Zenith Browser](assets/logo.png)

## Fonctionnalités

- Interface sombre et épurée
- Gestion des onglets (drag & drop, clic molette pour fermer)
- Page d'accueil personnalisable avec horloge, météo, calendrier et raccourcis
- Animations de fond (Galaxy, Medusa, fonds Unsplash)
- Gestionnaire de téléchargements avec progression et vitesse
- Historique de navigation avec recherche
- Bloqueur de publicités intégré
- Blocage des cookies tiers
- DevTools intégrés
- Thème clair/sombre synchronisé

## Installation

```bash
# Cloner le repo
git clone https://github.com/VOTRE_USERNAME/Zenith.git
cd Zenith

# Installer les dépendances
npm install

# Lancer l'application
npm start
```

## Build

```bash
# Windows
npm run build:win

# macOS
npm run build:mac

# Linux
npm run build:linux
```

## Raccourcis clavier

| Raccourci | Action |
|-----------|--------|
| Ctrl+T | Nouvel onglet |
| Ctrl+W | Fermer l'onglet |
| Ctrl+Shift+T | Rouvrir le dernier onglet |
| Ctrl+Tab | Onglet suivant |
| Ctrl+Shift+Tab | Onglet précédent |
| Ctrl+L | Focus barre d'URL |
| Ctrl+R | Rafraîchir |
| Ctrl+Shift+R | Rafraîchir (cache ignoré) |
| Ctrl+J | Téléchargements |
| Ctrl+H | Historique |
| F12 | DevTools |

## Structure

```
Zenith/
├── src/
│   ├── main.js          # Process principal Electron
│   ├── preload.js       # Bridge API
│   ├── renderer.js      # Interface navigateur
│   ├── index.html       # Structure HTML
│   ├── styles.css       # Styles
│   └── home/            # Page d'accueil
├── assets/
│   ├── logo.png
│   └── logo.ico
└── package.json
```

## Technologies

- Electron
- HTML/CSS/JavaScript vanilla

## Licence

MIT
