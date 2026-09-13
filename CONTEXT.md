# Contexte du projet Electror

Dernière mise à jour : 13 septembre 2026.

## Produit

Electror est le nom du dépôt ; **Wattwise** est le nom affiché dans l’application.
PWA en français pour choisir quand consommer selon le prix de gros et l’intensité carbone.
Production : https://electror.vercel.app. Le fonctionnement en ligne a été confirmé par
l’utilisateur après la configuration Vercel ; les dernières améliorations doivent suivre
le déploiement de leur commit.

## Architecture et hébergement

- React 19, TypeScript, Vinext, Vite, Tailwind CSS et Recharts.
- `src/components/Dashboard.tsx` orchestre les données, les préférences et les recommandations.
- `app/api/forecast/route.ts` protège la clé Electricity Maps et regroupe cinq flux : prix
  combinés, carbone, renouvelables, mix et historique des prix.
- `src/services/smartOptimizer.ts` compare les fenêtres compatibles avec les contraintes.
- `src/services/plannerHelp.ts` vérifie la faisabilité des objectifs de recharge.
- `src/components/HelpGuide.tsx` propose un guide dans une boîte de dialogue native.
- Préférences, cache et prévisions archivées sont conservés localement dans le navigateur.

Vercel utilise Nitro avec une fonction Node.js 22. `vercel.json` sélectionne
`npm run build:vercel`. La sortie `.vercel/output` comprend les ressources statiques,
la fonction `__server.func` et le routage vers cette fonction. Un déploiement limité aux
fichiers statiques avait provoqué le 404 initial.

La configuration Cloudflare/Sites reste présente : `npm run dev` pour le développement
et `npm run build` pour Cloudflare. Le choix explicite du projet en production est Vercel.

## Variables d’environnement

- `ELECTRICITY_MAPS_API_KEY` : Secret côté serveur uniquement.
- `NEXT_PUBLIC_SITE_URL` : Config publique, `https://electror.vercel.app` en production.
- Les fichiers `.env*` sont ignorés, sauf `.env.example`. Ne jamais documenter de vraie clé.
- Un changement de variable Vercel nécessite un nouveau déploiement.

## Comportement et limites

- Zones : FR, DE, BE, ES, IT-NO et NL ; horizons 24, 48 ou 72 h selon les droits API.
- Modes économique, écologique ou équilibré ; prix et carbone normalisés pour le compromis.
- Horaires exprimés dans le fuseau de l’appareil. Planification d’un seul cycle à la fois.
- La puissance maximale compare l’appareil au logement, sans mesurer les autres usages.
- Recharge : rendement estimé de 90 %, durée arrondie aux options disponibles, plafond 12 h.
  Au-delà, aucun créneau complet n’est recommandé ; un message donne durée et niveau
  atteignable. Une cible inférieure ou égale au niveau actuel est signalée comme déjà atteinte.
- Les diagnostics distinguent puissance invalide ou excessive, données futures manquantes,
  durée non couverte, silence et incompatibilité des horaires.
- Prix et économies correspondent au marché de gros, hors taxes/réseau/abonnement.
  Un contrat à prix fixe ne garantit aucune économie liée au décalage du cycle.
- Renouvelable et bas carbone sont distincts ; le nucléaire est bas carbone, non renouvelable.
- Les alertes sont évaluées au chargement et à l’actualisation, avec permission navigateur.
  Il n’y a pas de surveillance permanente ni de push garanti application fermée.
- La précision des prévisions dépend des correspondances disponibles dans l’archive locale.

## Vérifications

```bash
npm test
npm run typecheck
npm run lint
npm run test:vercel
```

Dernière validation des fonctionnalités d’aide : 27 tests réussis, typage et lint propres,
build Vercel réussi. Le contrôle du build vérifie l’accueil, les ressources et l’API avec
des réponses simulées ; il ne constitue pas une vérification du déploiement distant.

## Suites envisagées

Comparaison de zones, calendrier multi-appareils, tarifs contractuels et notifications
côté serveur restent des pistes, pas des fonctionnalités livrées. Voir le README et le CHANGELOG.
