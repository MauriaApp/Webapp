# Mauria Webapp

Interface web de Mauria, le tableau de bord étudiant Junia.

## Technologies utilisées

- React `v19` et Vite `v6` pour une SPA moderne et rapide
- TypeScript `v5.7` pour la sécurité de typage
- Tailwind CSS `v4`, `tailwindcss-safe-area` et `tailwindcss-animate` pour le design réactif
- shadcn/ui, Radix UI et Lucide pour la bibliothèque de composants
- TanStack Query `v5` (persistance locale) et React Query Devtools
- FullCalendar `v6` pour la visualisation du planning
- Framer Motion / Motion pour les animations
- Sonner pour les notifications in-app
- Docker + Nginx + Fly.io pour le déploiement
- Sentry pour l’observabilité en production
- Supabase (via l’API Mauria) pour les contenus dynamiques

## Structure du projet

Nous avons séparé le projet en plusieurs dossiers :

- `public` : assets statiques (icône, manifestes, etc.)
- `src/components` : composants transverses (navigation, tiroirs, UI shadcn)
- `src/pages` : pages routées (accueil, planning, notes, absences, agenda, secondaires)
- `src/contexts` : providers (thème, année scolaire, modales, React Query)
- `src/lib/api` : clients Aurion & Supabase, helpers et stockage
- `src/lib/utils` : utilitaires (planning, agenda, parsing des cours, mises à jour…)
- `src/hooks` : hooks personnalisés (mobile, toasts…)
- `src/styles` : feuille Tailwind globale et configuration thème
- `src/types` : définitions TypeScript partagées
- `components.json` : configuration shadcn/ui
- `vite.config.ts`, `tsconfig*.json`, `eslint.config.js` : configuration build & lint
- `Dockerfile`, `nginx.conf`, `fly.toml` : infrastructure de déploiement

## Fonctionnalités

### Intégration Aurion & Supabase

L’application utilise l’API Fastify `API-v2` pour diriger Aurion et les contenus Supabase. Les informations de session sont stockées côté client et synchronisées avec l’app Ionic via `postMessage`.

### Planification & agenda

Le planning s’appuie sur FullCalendar, combine les cours Aurion et les événements saisis par l’utilisateur, et permet un export vers l’app mobile. Un agenda léger complète l’expérience avec des rappels locaux.

### Expérience utilisateur

Transitions animées (Framer Motion), pull-to-refresh, toasts différés, tiroirs contextuels et navigation adaptative mobile/desktop offrent une UX proche de l’application native.

### Personnalisation & stockage

Thème clair/sombre, mise à l’échelle de l’UI et cache React Query gérés via `localStorage`, permettant un fonctionnement hors ligne partiel et une restitution rapide des données.

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
- Aligner la communication avec la Landing Page et les autres apps Mauria

## License

Ce projet est sous licence GNU v3. Pour plus d’informations, voir le fichier `LICENSE` à la racine du projet.
