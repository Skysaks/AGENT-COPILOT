# Sécurité / Security policy

## Signaler une faille

Merci de **ne pas ouvrir d'issue publique** pour un problème de sécurité.

Signale-le en privé sur GitHub : **Security → Report a vulnerability** sur ce dépôt. Indique ce qui est
touché, comment le reproduire et l'impact attendu. Accusé de réception sous 7 jours ; merci de laisser un
délai raisonnable pour corriger avant toute divulgation.

*Please report vulnerabilities privately through GitHub's "Report a vulnerability" button, never in a
public issue.*

## Périmètre

Dans le périmètre : `dist/agent-copilot.html`, l'import JSON, le mode local et le mode hébergé (stockage privé, copilote IA).
Hors périmètre : la plateforme d'hébergement elle-même (GitHub Pages, hébergeur de la version connectée)
et les failles de dépendances déjà suivies en amont.

## Ce qui est déjà en place

- **Aucune requête réseau à l'ouverture**, polices comprises : tout est embarqué dans le fichier. Le build
  et la CI échouent si une ressource externe réapparaît.
- **Aucun secret dans le code** : pas de clé d'API, pas de jeton, pas d'adresse personnelle ;
  `npm run verify` le contrôle à chaque push (`scripts/lib.mjs`, règles `privacyFindings`).
- Les réponses du copilote sont échappées avant la mise en forme Markdown ; aucun HTML du modèle n'est injecté tel quel.
- L'import n'accepte qu'un export de l'application (champ `app` vérifié) ; les fichiers inconnus sont refusés.
- Les consignes interdisent au copilote de demander des données inutiles à la décision ; les mineurs déclenchent une vérification avant toute stratégie.
- **Chaîne de build minimale** : aucune dépendance d'exécution ; une seule dépendance de développement
  (Playwright, pour les tests), surveillée par Dependabot et `npm audit` en CI. Actions GitHub épinglées
  par empreinte SHA, jeton de CI en lecture seule.
