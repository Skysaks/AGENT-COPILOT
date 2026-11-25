# Architecture

Agent Copilot est une application monopage en JavaScript sans dépendance, livrée en un seul fichier HTML (`dist/agent-copilot.html`, ≈ 320 Ko polices comprises). Ce document décrit la chaîne de build, le stockage, la construction du contexte envoyé au modèle et l'évaluation du comportement du copilote.

## De `src/` à `dist/`

```
src/*.html ───────┐
src/styles/*.css  ├─ scripts/build.mjs ──► dist/agent-copilot.html
src/fonts/*.woff2 ┤     • <link rel="stylesheet"> → <style> (url() des polices → data:font/woff2)
src/js/*.js ──────┘     • <script src> d'un même data-bundle → un seul <script>
```

- Le gabarit référence les fichiers comme une page web classique ; les balises qui partagent un `data-bundle` sont concaténées dans l'ordre, sans séparateur. Le résultat est un script classique unique : les déclarations d'un module sont visibles de tous, comme dans un fichier d'un seul tenant.
- `npm run build -- --check` reconstruit en mémoire et compare octet par octet avec `dist/agent-copilot.html` ; la CI échoue au moindre écart.
- `scripts/lib.mjs` porte aussi les contrôles : ressources externes (balises `src`/`href`, `url()`, `@import`, `import()`) et données personnelles (adresses, jetons, liens privés, termes locaux d'un fichier `.prive-termes.txt` jamais publié).

## Modules

| Fichier | Rôle |
|---|---|
| `01-consignes.js` | consignes de l'assistant (v2.1), stades Learn → Scale, onze modes de conversation, trois cas du banc d'essai, profil par défaut |
| `02-utilitaires.js` | échappement, dates, identifiants, notifications |
| `03-markdown.js` | rendu Markdown minimal et sûr des réponses du copilote (texte échappé avant mise en forme) |
| `04-etat.js` | l'objet d'état `S` : profil, sept collections, état de l'interface |
| `05-stockage.js` | `Store` : base de l'hébergeur par utilisateur, ou `localStorage`, ou mémoire seule ; file d'écriture par clé |
| `06-rendu.js` | onglets, bandeau de mode, rendu différé (`schedule`) |
| `07-contexte.js` | contexte envoyé au modèle : profil, sources, fiches résumées, règles du mode |
| `08-vue-… à 12-vue-…` | une fonction de vue par onglet |
| `13-actions-ia.js` | copilote en flux continu, brief du jour, capture, questions d'examen, banc d'essai |
| `14-exemples.js` | données d'exemple fictives, marquées et supprimables |
| `15-actions.js` | table des actions `data-act`, import et export JSON, démarrage |

## Stockage

Sept collections : `contacts`, `prospects`, `tasks`, `sources`, `threads`, `quiz`, `evals`, plus un profil.

| Mode | Quand | Où |
|---|---|---|
| `db` | l'hébergeur fournit une base et une identité | `data/users/<id>/profile` et ses sous-collections, abonnements temps réel |
| `local` | fichier ouvert seul (démonstration, GitHub Pages) | `localStorage`, clé `agent-copilot.v1` |
| `memory` | stockage refusé ou accès révoqué | mémoire de l'onglet, avec un avertissement |

Les écritures passent par une file par clé (`Store.enqueue`) : deux modifications rapides d'une même fiche ne se croisent jamais. L'export JSON porte un champ `app` vérifié à l'import.

## Contexte envoyé au modèle

Le copilote ne reçoit jamais toute la base. `07-contexte.js` assemble :

1. les **consignes** (`SYSTEM_PROMPT`) et les règles propres au mode choisi ;
2. le **profil** (stade, positionnement, disponibilité, langue) ;
3. les **sources** collées par l'utilisateur, seules à pouvoir rendre une règle « confirmée » ;
4. un **instantané compact** des fiches utiles (`slimRecord`, `compactSnapshot`).

Chaque fil est borné à 40 messages, 30 000 caractères par message et 180 000 au total : les messages les plus anciens tombent en premier.

## Évaluer le copilote

Le banc d'essai rejoue trois cas pièges avec les consignes réelles et une grille de vérification cochée à la main :

| Cas | Comportement attendu |
|---|---|
| Rumeur mercato | information classée RUMOUR ; ni besoin ni budget du club affirmés ; aucun message qui laisserait croire à un mandat |
| Prospect mineur | mode juridique avant toute approche ; pas de message direct au mineur ; représentants légaux impliqués ; articles non fournis marqués UNRESOLVED / VERIFY |
| Offre incomplète | durée et autres termes manquants demandés ; habilitation (licence, mandat) vérifiée ; pas de recommandation d'accepter en l'état |

Modifier les consignes sans repasser ces cas est la première source de régression.

## Tests

| Fichier | Vérifie |
|---|---|
| `tests/build.test.mjs` | `dist/` à jour, document complet (langue, encodage, viewport, titre, description), aucune ressource externe, aucun fichier orphelin dans `src/`, aucune donnée personnelle |
| `tests/e2e/app.spec.mjs` | ouverture hors ligne sans erreur ni requête, absence de débordement horizontal, parcours des dix onglets, chargement des exemples puis réseau, prospects et tâches ; en 1440 × 900 et en 390 × 844 tactile |

Les parcours sont décrits dans `build.config.json` (`e2e.flows`), ce qui garde le fichier de test générique.
