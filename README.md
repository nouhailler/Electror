# Wattwise — Electricity Price Planner

Wattwise est une PWA mobile-first qui aide à répondre à une question simple : **quand est-il préférable de consommer de l’électricité ?** La V0.1 affiche les prévisions de prix Electricity Maps, les statistiques de la période, le meilleur créneau d’une heure et le prochain pic.

## Fonctionnalités V0.1

- zones France, Allemagne, Belgique, Espagne, Italie du Nord et Pays-Bas ;
- horizons réels de 24, 48 et 72 heures ;
- prix minimum, moyen et maximum ;
- prochain créneau avantageux, prochaine période chère et prochain pic ;
- meilleur créneau d’une heure et économie par rapport à la moyenne ;
- classification relative en cinq niveaux, sans seuil monétaire arbitraire ;
- graphique tactile responsive avec repères min/moyenne/max ;
- états de chargement, configuration, erreur, absence de données et données périmées ;
- cache local de 15 minutes, dernier jeu de données disponible hors ligne ;
- thèmes système, clair et sombre ;
- manifeste, service worker et mode standalone installable.

## Technologies

- TypeScript et React 19 ;
- Vinext/Vite, sortie ESM compatible Cloudflare Workers ;
- Tailwind CSS et composants shadcn ;
- Recharts pour la visualisation ;
- Vitest pour les tests métier ;
- route serveur légère pour protéger la clé Electricity Maps.

## Installation

Prérequis : Node.js 22.13 ou supérieur.

```bash
npm install
cp .env.example .env
```

Ajoutez ensuite la clé fournie par Electricity Maps dans `.env` :

```dotenv
ELECTRICITY_MAPS_API_KEY=votre_cle
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Le fichier `.env` est ignoré par Git. La clé n’est ni envoyée au navigateur, ni stockée dans `localStorage` : le navigateur appelle uniquement la route interne `/api/forecast`.

## Développement, tests et production

```bash
npm run dev
npm test
npm run typecheck
npm run build
```

L’application locale est disponible par défaut sur `http://localhost:3000`.

## API Electricity Maps

La route serveur appelle exclusivement l’API V4 officielle :

```text
GET https://api.electricitymaps.com/v4/price-day-ahead/forecast
```

Paramètres utilisés :

- `zone` : identifiant Electricity Maps distinct du nom affiché ;
- `horizonHours` : `24`, `48` ou `72` ;
- `temporalGranularity=hourly` ;
- `disableCallerLookup=true`.

Authentification : en-tête `auth-token` injecté uniquement côté serveur. Les réponses utilisent les champs `zone`, `data[].datetime`, `data[].value`, `data[].unit`, `data[].source` et `data[].temporalGranularity`, puis sont transformées en modèles métier indépendants.

Documentation officielle : [Day-ahead price forecast](https://app.electricitymaps.com/docs/reference/day-ahead-price/forecast) et [Authorization](https://app.electricitymaps.com/docs/quickstart/authorization).

## Architecture

```text
app/
├── api/forecast/route.ts       # proxy sécurisé, timeout, cache et erreurs HTTP
├── layout.tsx                  # métadonnées et configuration PWA
└── page.tsx                    # entrée de l’interface
src/
├── api/                        # client de la route interne
├── components/                 # dashboard, graphique et skeleton
├── config/                     # mapping noms de zones ↔ identifiants API
├── hooks/                      # orchestration chargement/cache/erreurs
├── services/                   # mapper, cache et logique métier
├── test/fixtures/              # réponses API réalistes sans appel réseau
├── types/                      # modèles API et domaine
└── utils/                      # formatage localisé
public/
├── manifest.webmanifest
├── icon.svg
└── sw.js
```

Flux de données :

```text
Interface → useForecast → client interne → /api/forecast → Electricity Maps
                         ↘ cache local       ↘ cache serveur 15 min
```

## Cache et fonctionnement hors ligne

Le proxy conserve une réponse pendant 15 minutes afin de limiter les appels externes. Le navigateur conserve également les dernières prévisions par zone et horizon pendant sept jours ; après 15 minutes elles sont explicitement marquées comme anciennes et une actualisation est tentée. Si le réseau est indisponible, ces données restent visibles avec leur date réelle de mise à jour.

Le service worker met en cache l’enveloppe de l’application et les ressources statiques. Il ne met pas en cache la route API : la fraîcheur des prévisions reste gérée par la couche métier, qui ne présente jamais une ancienne réponse comme actuelle.

## Logique métier

Les seuils visuels correspondent aux quintiles de la période affichée. Le meilleur créneau minimise le prix moyen d’une fenêtre contiguë ; la fonction accepte déjà une durée paramétrable même si l’interface V0.1 utilise une heure. Le prochain pic est le premier prix futur situé dans le quintile supérieur, avec repli sur le maximum futur.

## Limites connues

- une clé et un plan Electricity Maps autorisant l’endpoint, la zone et l’horizon demandés sont indispensables ;
- l’essai API de 14 jours peut expirer et un horizon de 48/72 h peut dépendre des droits du plan ;
- l’Italie est représentée en V0.1 par la zone de marché `IT-NO` (Italie du Nord), car le prix day-ahead est zonal ;
- l’unité est affichée exactement telle que renvoyée par l’API, sans conversion ;
- les prix day-ahead ne sont pas les tarifs finaux facturés au consommateur ;
- aucune donnée simulée n’est affichée dans l’application : sans clé, un état de configuration explicite apparaît.

## Sécurité

Ne préfixez jamais la clé par `NEXT_PUBLIC_` ou `VITE_`. Pour un autre hébergeur, conservez la route serveur ou une fonction serverless équivalente ; un appel direct depuis une PWA exposerait la clé dans le bundle et les outils réseau du navigateur.
