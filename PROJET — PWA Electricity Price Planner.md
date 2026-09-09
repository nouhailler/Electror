# PROJET — PWA Electricity Price Planner
## V0.1 — MVP : prévisions du prix de l'électricité

Tu dois commencer immédiatement le développement de cette application.

Le projet est une **PWA (Progressive Web App)** destinée principalement aux smartphones et permettant de consulter et d'analyser les prévisions du prix de l'électricité à partir de l'API **Electricity Maps**.

Documentation API de référence :

https://app.electricitymaps.com/docs/reference/day-ahead-price/forecast

J'ai actuellement une **clé API Electricity Maps valable pendant 14 jours** pour développer et tester l'application.

---

# 1. OBJECTIF DU PROJET

Créer une PWA moderne permettant à un utilisateur de répondre très simplement à la question :

> **« Quand est-il préférable de consommer de l'électricité ? »**

La première version doit se concentrer sur l'affichage et l'analyse des prévisions de prix.

NE PAS développer immédiatement les fonctionnalités avancées comme la recharge d'une voiture électrique, les batteries, l'historique avancé ou l'optimisation automatique.

Nous allons construire l'application progressivement par versions.

---

# 2. VISION À LONG TERME

L'application pourra évoluer vers :

- prévisions 24/48/72 heures ;
- identification des périodes les moins chères ;
- identification des périodes les plus chères ;
- calcul du prix moyen ;
- recommandations de consommation ;
- planification d'appareils ;
- planification de recharge d'une voiture électrique ;
- optimisation d'une batterie domestique ;
- alertes de prix ;
- historique ;
- comparaison prévisions/réalité ;
- comparaison de plusieurs zones ;
- carte européenne des prix ;
- notifications PWA ;
- score énergétique ;
- assistant énergétique.

Mais ces fonctionnalités appartiennent aux versions suivantes.

---

# 3. TECHNOLOGIES

Avant de coder, inspecte le dépôt existant.

Si le projet est vide, mets en place une architecture moderne adaptée à une PWA.

Privilégier :

- TypeScript ;
- React ;
- Vite ;
- PWA ;
- CSS moderne ou solution légère et maintenable ;
- architecture modulaire ;
- composants réutilisables ;
- séparation claire entre UI, logique métier et accès API.

Si le dépôt utilise déjà une stack différente et cohérente, ne la remplace pas inutilement.

Le projet doit pouvoir être lancé facilement en développement et construit pour production.

---

# 4. ARCHITECTURE

Créer une architecture propre.

Par exemple :

src/
├── components/
├── pages/
├── services/
├── api/
├── hooks/
├── types/
├── utils/
├── config/
└── styles/

Adapter cette organisation à la stack réellement utilisée.

Créer une couche dédiée à Electricity Maps.

NE JAMAIS disperser les appels HTTP Electricity Maps directement dans les composants React.

Exemple logique :

UI
 ↓
hooks/services
 ↓
Electricity Maps API client
 ↓
API Electricity Maps

---

# 5. GESTION DE LA CLÉ API

La clé API ne doit :

- jamais être écrite en dur dans le code ;
- jamais être commitée dans Git ;
- jamais être affichée dans l'interface ;
- jamais être enregistrée dans localStorage.

Utiliser les variables d'environnement adaptées à la stack.

Créer un fichier :

.env.example

avec une variable du type :

ELECTRICITY_MAPS_API_KEY=

Adapter le nom de variable à la technologie effectivement utilisée.

Ajouter le fichier .env au .gitignore s'il ne l'est pas déjà.

IMPORTANT :

L'architecture doit permettre de changer facilement la stratégie d'accès à l'API plus tard.

Si une clé côté navigateur présente un problème de sécurité ou de compatibilité avec l'API, documenter clairement la solution recommandée plutôt que de contourner les protections de l'API.

---

# 6. INTÉGRATION ELECTRICITY MAPS

Utiliser exclusivement la documentation officielle Electricity Maps pour déterminer :

- l'URL exacte de l'endpoint ;
- les paramètres nécessaires ;
- le format d'authentification ;
- le format de réponse ;
- les unités ;
- les champs retournés ;
- la gestion des erreurs.

Documentation :

https://app.electricitymaps.com/docs/reference/day-ahead-price/forecast

NE PAS inventer le format de l'API.

Créer des types TypeScript correspondant aux réponses API réellement utilisées.

Prévoir une gestion correcte de :

- HTTP 400 ;
- HTTP 401 ;
- HTTP 403 ;
- HTTP 404 ;
- HTTP 429 ;
- erreurs réseau ;
- réponse vide ;
- données incomplètes ;
- timeout.

---

# 7. PREMIÈRE FONCTIONNALITÉ : CHOIX DE LA ZONE

Créer une interface permettant de sélectionner une zone/pays compatible avec Electricity Maps.

Pour le MVP, commencer avec quelques zones faciles à tester, dont :

- France ;
- Allemagne ;
- Belgique ;
- Espagne ;
- Italie ;
- Pays-Bas.

Prévoir une architecture permettant d'ajouter facilement d'autres zones.

Ne pas supposer que le nom affiché par l'application correspond directement au paramètre API.

Créer une configuration interne permettant d'associer :

nom affiché
+
identifiant Electricity Maps.

---

# 8. DASHBOARD

Créer une page principale :

## Prix de l'électricité

Afficher clairement :

- zone sélectionnée ;
- date ;
- prix minimum ;
- prix maximum ;
- prix moyen ;
- prochaine période bon marché ;
- prochaine période chère.

Exemple visuel :

PRIX DE L'ÉLECTRICITÉ

France

Prix minimum
52 €/MWh

Prix moyen
74 €/MWh

Prix maximum
143 €/MWh

Prochaine période avantageuse
02:00 → 05:00

---

# 9. GRAPHIQUE PRINCIPAL

Créer un graphique permettant de visualiser les prévisions.

Le graphique doit afficher :

- heure ;
- prix ;
- minimum ;
- maximum ;
- moyenne ;
- distinction entre les données disponibles/prévues si l'API permet cette distinction.

Le graphique doit être :

- responsive ;
- utilisable sur smartphone ;
- lisible tactilement ;
- avec tooltip au toucher ;
- avec unité clairement indiquée.

Prévoir des boutons :

[24 h] [48 h] [72 h]

Si l'API ou le plan ne permet pas réellement l'une de ces périodes, ne pas simuler les données.

---

# 10. CODE COULEUR

Ajouter une interprétation visuelle des prix.

Les périodes les moins chères doivent être visuellement identifiables.

Les périodes intermédiaires également.

Les périodes les plus chères doivent être clairement identifiables.

Éviter de mettre des seuils arbitraires fixes sans justification.

Privilégier une classification relative aux prix de la période affichée.

Par exemple :

- très bon marché ;
- bon marché ;
- moyen ;
- cher ;
- très cher.

La logique de classification doit être isolée dans un module métier afin de pouvoir être modifiée ultérieurement.

---

# 11. « MEILLEUR MOMENT »

Ajouter une fonctionnalité :

## Meilleur moment pour consommer

Analyser les prévisions disponibles.

Afficher :

- meilleur créneau ;
- prix moyen de ce créneau ;
- durée du créneau ;
- prix maximum ;
- économie potentielle par rapport au prix moyen.

Pour V0.1, utiliser une durée par défaut de 1 heure.

Préparer toutefois la logique pour accepter ultérieurement :

- 30 minutes ;
- 1 heure ;
- 2 heures ;
- 3 heures ;
- 4 heures ;
- etc.

---

# 12. « PROCHAIN PIC »

Ajouter :

## Prochain pic de prix

Afficher l'heure où le prix prévu est particulièrement élevé.

Exemple :

⚠️ Prochain pic

19:00

143 €/MWh

Cela doit être calculé à partir des données réellement disponibles.

---

# 13. ÉTATS DE L'INTERFACE

Prévoir obligatoirement les états :

### Chargement

Afficher un skeleton/loading propre.

### Succès

Afficher les données.

### Erreur API

Afficher un message compréhensible par l'utilisateur.

Ne jamais afficher simplement :

"undefined"
"500"
"fetch failed"

### Aucune donnée

Afficher un message spécifique.

### API key absente

Afficher une erreur de configuration destinée au développeur et non une erreur technique incompréhensible pour l'utilisateur.

---

# 14. CACHE

Mettre en place un cache raisonnable afin d'éviter des appels API inutiles.

Le cache doit être compatible avec une PWA.

Afficher éventuellement :

"Mis à jour à 21:15"

Ne jamais faire des appels API à chaque rendu React.

---

# 15. PWA

L'application doit être installable comme PWA.

Mettre en place :

- manifest ;
- service worker ;
- icône ;
- nom de l'application ;
- mode standalone ;
- responsive design ;
- stratégie de cache adaptée.

Prévoir une expérience correcte lorsque l'utilisateur perd temporairement sa connexion.

La dernière donnée disponible peut être affichée avec une indication claire :

"Dernière donnée disponible : ..."

Ne jamais présenter une donnée ancienne comme si elle était actuelle.

---

# 16. INTERFACE MOBILE

Priorité absolue au smartphone.

L'interface doit être :

- simple ;
- rapide ;
- lisible ;
- tactile ;
- peu chargée.

Prévoir également une bonne adaptation desktop.

Navigation simple :

Accueil
Prix
Prévisions
Paramètres

Ne pas multiplier les écrans inutilement dans V0.1.

---

# 17. THÈME

Prévoir :

- mode clair ;
- mode sombre ;
- détection du thème système.

L'utilisateur doit pouvoir changer le thème.

---

# 18. PARAMÈTRES

Créer une petite page Paramètres avec :

### Zone

France
Allemagne
Belgique
Espagne
Italie
Pays-Bas

### Devise/unité

Pour V0.1, afficher clairement l'unité fournie par l'API et ne pas effectuer de conversion monétaire non justifiée.

### Thème

Système
Clair
Sombre

---

# 19. TYPES ET DONNÉES

Créer des types métier indépendants du format brut de l'API.

Par exemple conceptuellement :

PricePoint
Forecast
PriceStatistics
PriceWindow
Zone

L'interface utilisateur doit travailler principalement avec ces modèles métier et non directement avec le JSON brut d'Electricity Maps.

Créer un mapper :

API response
→
modèle métier

Cela facilitera les futures évolutions.

---

# 20. TESTS

Créer des tests pour au minimum :

- transformation de la réponse API ;
- calcul minimum ;
- calcul maximum ;
- calcul moyenne ;
- recherche du meilleur créneau ;
- recherche du prochain pic ;
- classification des prix ;
- gestion d'une réponse vide.

Ne pas dépendre obligatoirement de l'API réelle pour les tests.

Créer des fixtures/mock data réalistes.

---

# 21. PERFORMANCE

Faire attention à :

- nombre de requêtes API ;
- re-render React ;
- taille du bundle ;
- chargement mobile ;
- graphiques ;
- cache.

Ne pas ajouter de dépendances lourdes sans raison.

---

# 22. ACCESSIBILITÉ

Prévoir :

- contraste correct ;
- navigation clavier ;
- labels ;
- boutons suffisamment grands ;
- textes lisibles ;
- ne pas dépendre uniquement de la couleur pour transmettre une information.

Par exemple, un prix élevé ne doit pas être indiqué uniquement par la couleur rouge.

---

# 23. DOCUMENTATION

Créer ou mettre à jour :

README.md

Le README doit expliquer :

1. le projet ;
2. les technologies ;
3. l'installation ;
4. la configuration de la clé API ;
5. le lancement en développement ;
6. le build production ;
7. le fonctionnement de la PWA ;
8. l'architecture ;
9. les endpoints Electricity Maps utilisés ;
10. les limitations éventuelles du plan/API.

Ne jamais mettre ma véritable clé API dans le README.

---

# 24. GIT

Avant de terminer :

- vérifier git status ;
- vérifier qu'aucun secret n'est présent ;
- vérifier .gitignore ;
- ne pas committer de clé API ;
- ne pas modifier inutilement des fichiers sans rapport.

---

# 25. CE QUI EST EXPRESSÉMENT HORS PÉRIMÈTRE DE V0.1

NE PAS développer maintenant :

- compte utilisateur ;
- authentification ;
- backend complexe ;
- base de données ;
- abonnement ;
- paiement ;
- recharge réelle d'une voiture ;
- contrôle d'une borne ;
- contrôle d'une batterie ;
- contrôle d'appareils domestiques ;
- domotique ;
- historique long terme ;
- comparaison prévision/réalité ;
- notifications avancées ;
- carte européenne ;
- IA ;
- assistant conversationnel ;
- optimisation automatique ;
- connexion à Home Assistant ;
- connexion à une voiture ;
- connexion à un fournisseur d'électricité.

Ces fonctionnalités pourront être étudiées dans des versions ultérieures.

---

# 26. RÈGLE IMPORTANTE : NE PAS SE CONTENTER D'UN MOCKUP

Je veux une **application réellement fonctionnelle**.

Tu dois :

1. inspecter le dépôt ;
2. comprendre l'état actuel du projet ;
3. installer/configurer ce qui est nécessaire ;
4. implémenter l'intégration réelle Electricity Maps ;
5. implémenter l'interface ;
6. lancer les tests ;
7. lancer le build ;
8. corriger les erreurs ;
9. vérifier le fonctionnement de la PWA ;
10. documenter le résultat.

Si une information de l'API manque dans ce prompt, consulte la documentation officielle Electricity Maps plutôt que d'inventer.

---

# 27. IMPORTANT : NE PAS SUR-ARCHITECTURER

Construire une base propre mais simple.

Ne pas créer prématurément :

- microservices ;
- backend complexe ;
- système d'utilisateurs ;
- base SQL ;
- architecture distribuée ;
- abstractions inutiles.

L'objectif est d'obtenir rapidement une **V0.1 fonctionnelle, propre et utilisable**.

---

# 28. CRITÈRES DE VALIDATION V0.1

La V0.1 sera considérée comme réussie si :

[ ] l'application démarre ;

[ ] la PWA peut être installée ;

[ ] une zone peut être sélectionnée ;

[ ] l'application appelle réellement Electricity Maps ;

[ ] les données de prix sont récupérées ;

[ ] les données sont transformées en modèle métier ;

[ ] le graphique fonctionne ;

[ ] les statistiques fonctionnent ;

[ ] le meilleur créneau est calculé ;

[ ] le prochain pic est calculé ;

[ ] les états loading/error/empty fonctionnent ;

[ ] le cache fonctionne correctement ;

[ ] le mode sombre fonctionne ;

[ ] l'interface fonctionne sur smartphone ;

[ ] les tests passent ;

[ ] le build production passe ;

[ ] aucune clé API n'est présente dans Git ;

[ ] README.md est à jour.

---

# 29. APRÈS L'IMPLÉMENTATION

Une fois la V0.1 terminée :

NE PAS commencer automatiquement une V0.2.

À la place, fournis un compte-rendu comprenant :

### Architecture créée

### Fichiers principaux

### Fonctionnalités implémentées

### Endpoint Electricity Maps utilisé

### Tests réalisés

### Résultat du build

### Problèmes rencontrés

### Points à améliorer

### Suggestions pour V0.2

Puis arrête-toi.

Commence maintenant le développement de la V0.1.