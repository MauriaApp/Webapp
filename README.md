# Mauria Webapp

Interface web de Mauria, le tableau de bord étudiant Junia.

## Technologies utilisées

- React `v19` et Vite `v6` pour une SPA moderne et rapide
- TypeScript `v5.9` pour la sécurité de typage
- Tailwind CSS `v4` et `tailwindcss-animate` pour le design réactif
- shadcn/ui, Radix UI et Lucide pour la bibliothèque de composants
- TanStack Query `v5` (persistance locale) et React Query Devtools
- FullCalendar `v6` pour la visualisation du planning
- Framer Motion / Motion pour les animations
- Recharts pour les graphiques de notes
- i18next pour l’internationalisation (français, anglais, espagnol)
- Sonner pour les notifications in-app
- Docker + Nginx + Fly.io pour le déploiement
- Sentry pour l’observabilité en production
- Supabase (via l’API Mauria) pour les contenus dynamiques

## Structure du projet

Nous avons séparé le projet en plusieurs dossiers :

- `public` : assets statiques (icône, manifestes, etc.)
- `src/components` : composants transverses (navigation, tiroirs, calendrier, UI shadcn)
- `src/pages` : pages routées (accueil, planning, notes, absences, agenda, colles, documents, réglages, Palantir, stages, secondaires)
- `src/contexts` : providers (modales, toasts, React Query)
- `src/i18n` et `src/locales` : initialisation i18next et fichiers de traduction
- `src/lib/api` : clients Aurion & Supabase, colles, salles libres, Palantir, impression, helpers
- `src/lib/utils` : utilitaires (planning, agenda, notes, coefficients, campus, stockage…)
- `src/hooks` : hooks personnalisés (mobile…)
- `src/styles` : feuille Tailwind globale et configuration thème
- `src/types` : définitions TypeScript partagées
- `components.json` : configuration shadcn/ui
- `vite.config.ts`, `tsconfig*.json`, `eslint.config.js` : configuration build & lint
- `Dockerfile`, `nginx.conf`, `fly.toml` : infrastructure de déploiement

## Fonctionnalités

### Intégration Aurion & Supabase

L’application utilise l’API Fastify `API-v2` pour diriger Aurion et les contenus Supabase. Les informations de session sont stockées côté client et synchronisées avec la coquille Capacitor via `postMessage`, ainsi qu’avec les widgets Android.

### Planification & agenda

Le planning s’appuie sur FullCalendar, combine les cours Aurion, les colles, les plannings de DS et les événements saisis par l’utilisateur, et permet un export `.ics`. Un agenda léger complète l’expérience avec des rappels locaux. La recherche de salles libres couvre les campus de Lille et Châteauroux.

### Notes & absences

Coefficients par classe et par matière, moyennes par semestre et par groupe (CIR inclus), graphique d’évolution, filtre par semestre et effets de révélation animés pour ouvrir ses notes.

### Vie étudiante

Menus du RU par ville (Lille, Châteauroux), associations, documents Aurion, statut BadJunia et messages importants de l’école.

### Palantir

Vues enseignant : plannings et colles par formateur, recherche de personnes et détails des événements.

### Expérience utilisateur

Transitions animées (Framer Motion), pull-to-refresh, toasts différés, tiroirs contextuels et navigation adaptative mobile/desktop offrent une UX proche de l’application native. Interface traduite en trois langues avec règle ESLint interdisant le texte brut dans le JSX.

### Personnalisation & stockage

Thèmes clair/sombre/OLED, arrière-plans, mise à l’échelle de l’UI et cache React Query gérés via `localStorage`, permettant un fonctionnement hors ligne partiel et une restitution rapide des données.

## Installation

### Prérequis

- Node.js `v20+`
- pnpm
- Accès à l’API Mauria (`https://mauria-api.fly.dev` par défaut dans `src/lib/api/helper.ts`)

### Installation

1. Cloner le dépôt
2. Se placer dans le dossier du projet : `cd Webapp`
3. Installer les dépendances : `pnpm install`
4. Lancer le serveur de développement : `pnpm dev`
5. Accéder à l’application : `http://localhost:5173`

## Contribution

- Créer une branche depuis `main` et utiliser `pnpm` pour la gestion des packages
- Respecter les conventions existantes (TypeScript strict, import alias `@/`)
- Vérifier le formatage Tailwind et lancer `pnpm lint` avant toute PR
- Tester les parcours clés (planning, notes, absences, agenda) avec l’API `API-v2`
- Passer par `src/lib/utils/storage.ts` pour toute écriture dans `localStorage`
- Aligner la communication avec la Landing Page et les autres apps Mauria

## License

Ce projet est sous licence GNU v3. Pour plus d’informations, voir le fichier `LICENSE` à la racine du projet.
