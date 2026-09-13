# Historique des changements

## Non versionné — 2026-09-13

La version du paquet reste `0.3.0` ; aucune nouvelle release n’est créée par cette entrée.

### Ajouts

- Guide intégré accessible avec « ? » : zone, appareil, contraintes et interprétation du résultat.
- Rubrique « Comprendre mes estimations » et FAQ sur les notifications, données anciennes,
  données absentes, précision locale et recharge électrique.
- Explications près des prix, des indicateurs carbone/renouvelables et du coût du cycle.
- Diagnostics détaillés lorsqu’aucune fenêtre ne convient, avec suggestions adaptées.
- Six tests supplémentaires sur les diagnostics et la faisabilité de recharge (27 au total).
- Document de contexte et historique du projet.

### Corrections

- Une recharge nécessitant plus de 12 h ne produit plus de recommandation tronquée annoncée
  comme complète ; affichage de la durée requise et du niveau estimé atteignable en 12 h.
- Détection des cibles déjà atteintes et des valeurs de batterie ou puissance invalides.
- Le message général d’absence de données est remplacé par une explication liée aux contraintes.

## Adaptation Vercel — 2026-09-13

- Build Nitro produisant une fonction serveur Node.js 22 et les règles de routage Vercel.
- Configuration explicite de l’installation, du build et des ressources statiques.
- Mise à jour de Tailwind et ajout de son intégration Vite pour le build Nitro.
- Contrôle de la sortie Vercel : accueil, ressources, validation API et scénario de succès simulé.
- Documentation des variables et du redéploiement ; conservation du workflow local/Cloudflare.

## 0.3.0 — 2026-09-11

- Prix publiés et prévus via `price-day-ahead/combined`.
- Prévisions carbone, renouvelables et mix, ainsi qu’historique des prix.
- Optimisation économique, écologique ou équilibrée, contraintes horaires et puissance.
- Objectif de recharge défini par la capacité de batterie et les niveaux actuel/cible.
- Archive locale pour mesurer l’erreur et le biais des prévisions.
- Alertes par seuil et notifications navigateur.

## Versions antérieures

La V0.2 a introduit la planification par appareil, la durée et la puissance personnalisables,
ainsi que les estimations de consommation et de coût. Le socle comprend le tableau de bord
des prix, les six zones, les thèmes, le cache local et la PWA installable.
