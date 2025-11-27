# Documentation - Création d'un Challenge

## Vue d'ensemble

Lors de la création d'un challenge, **deux appels API** sont effectués :

1. **POST `/api/admin/challenges`** - Création du challenge
2. **POST `/api/questions`** (appelé plusieurs fois) - Création de chaque question associée

---

## 1. Création du Challenge

### Endpoint
```
POST /api/admin/challenges
```

### Payload (Type: `Partial<Challenge>`)

```typescript
{
  // Informations de base
  "titre": string,                    // Requis, min 3 caractères
  "description": string,              // Optionnel
  "points": number,                   // Requis, min 0 (points totaux du challenge)
  
  // Dates
  "dateDebut": string,                // Requis, format: "YYYY-MM-DDTHH:mm:ss" (LocalDateTime)
  "dateFin": string,                  // Requis, format: "YYYY-MM-DDTHH:mm:ss" (LocalDateTime)
  
  // Type et récompenses
  "typeChallenge": "INTERCLASSE" | "INTERNIVEAU",  // Requis
  "rewardMode": "STANDARD" | "TOP3",  // Requis
  "winnersCount": number,             // Requis, min 1 (nombre de gagnants)
  
  // Filtres (optionnels)
  "niveau": {                         // Optionnel, objet avec seulement l'id
    "id": number
  },
  "classe": {                         // Optionnel, objet avec seulement l'id
    "id": number
  },
  
  // Badges
  "badgeIds": number[]                // Optionnel, tableau d'IDs de badges
}
```

### Exemple de payload complet

```json
{
  "titre": "Challenge Mathématiques Avancées",
  "description": "Un challenge pour tester vos connaissances en mathématiques",
  "points": 100,
  "dateDebut": "2024-12-20T10:00:00",
  "dateFin": "2024-12-25T18:00:00",
  "typeChallenge": "INTERCLASSE",
  "rewardMode": "TOP3",
  "winnersCount": 3,
  "niveau": {
    "id": 5
  },
  "classe": {
    "id": 12
  },
  "badgeIds": [1, 3, 5]
}
```

### Notes importantes

- Les dates sont formatées en `LocalDateTime` (sans fuseau horaire) : `"YYYY-MM-DDTHH:mm:ss"`
- Si `niveauId` est `null` dans le formulaire, `niveau` n'est pas inclus dans le payload
- Si `classeId` est `null` dans le formulaire, `classe` n'est pas inclus dans le payload
- `badgeIds` est un tableau vide `[]` si aucun badge n'est sélectionné

---

## 2. Création des Questions

### Endpoint
```
POST /api/questions
```

### Payload (Type: `CreateQuestionRequest`)

Chaque question est créée avec un appel séparé. Le payload contient :

```typescript
{
  "challengeId": number,              // ID du challenge créé (obtenu de la réponse du premier appel)
  "enonce": string,                  // Requis, min 5 caractères (texte de la question)
  "points": number,                   // Optionnel, défaut: 1, min 1 (points de la question)
  "type": "QCU" | "QCM" | "VRAI_FAUX" | "APPARIEMENT",  // Requis
  "reponses": [                      // Requis, tableau de réponses
    {
      "libelle": string,             // Texte de la réponse
      "estCorrecte": boolean         // true si c'est une bonne réponse
    }
  ]
}
```

### Mapping des types de questions (Frontend → Backend)

| Frontend | Backend |
|----------|---------|
| `choix_multiple` | `QCU` |
| `multi_reponse` | `QCM` |
| `vrai_faux` | `VRAI_FAUX` |
| `appariement` | `APPARIEMENT` |
| `reponse_courte` | Non supporté (non envoyé) |
| `reponse_longue` | Non supporté (non envoyé) |
| `ordre` | Non supporté (non envoyé) |

### Exemples de payloads selon le type

#### Type: QCU (Choix Multiple - Une seule bonne réponse)
```json
{
  "challengeId": 123,
  "enonce": "Quelle est la capitale du Mali ?",
  "points": 5,
  "type": "QCU",
  "reponses": [
    { "libelle": "Bamako", "estCorrecte": true },
    { "libelle": "Kayes", "estCorrecte": false },
    { "libelle": "Ségou", "estCorrecte": false },
    { "libelle": "Mopti", "estCorrecte": false }
  ]
}
```

#### Type: QCM (Multi-réponses - Plusieurs bonnes réponses)
```json
{
  "challengeId": 123,
  "enonce": "Quelles sont les villes du Mali ? (Plusieurs réponses possibles)",
  "points": 10,
  "type": "QCM",
  "reponses": [
    { "libelle": "Bamako", "estCorrecte": true },
    { "libelle": "Kayes", "estCorrecte": true },
    { "libelle": "Paris", "estCorrecte": false },
    { "libelle": "Ségou", "estCorrecte": true }
  ]
}
```

#### Type: VRAI_FAUX
```json
{
  "challengeId": 123,
  "enonce": "Le Mali est situé en Afrique de l'Ouest",
  "points": 3,
  "type": "VRAI_FAUX",
  "reponses": [
    { "libelle": "VRAI", "estCorrecte": true },
    { "libelle": "FAUX", "estCorrecte": false }
  ]
}
```

#### Type: APPARIEMENT
```json
{
  "challengeId": 123,
  "enonce": "Associez chaque capitale à son pays",
  "points": 8,
  "type": "APPARIEMENT",
  "reponses": [
    { "libelle": "Bamako - Mali", "estCorrecte": true },
    { "libelle": "Dakar - Sénégal", "estCorrecte": true },
    { "libelle": "Ouagadougou - Burkina Faso", "estCorrecte": true }
  ]
}
```

**Note pour APPARIEMENT** : Les paires d'appariement du formulaire sont transformées en réponses avec le format `"elementGauche - elementDroit"` et toutes les réponses sont marquées comme `estCorrecte: true`.

---

## 3. Flux complet de création

```
1. L'utilisateur remplit le formulaire de challenge
   ↓
2. Validation du formulaire (titre, dates, au moins une question)
   ↓
3. POST /api/admin/challenges
   Payload: { titre, description, points, dateDebut, dateFin, typeChallenge, rewardMode, winnersCount, niveau?, classe?, badgeIds }
   ↓
4. Réponse: Challenge créé avec { id: 123, ... }
   ↓
5. Pour chaque question du formulaire:
   POST /api/questions
   Payload: { challengeId: 123, enonce, points, type, reponses[] }
   ↓
6. Toutes les questions sont créées en parallèle (forkJoin)
   ↓
7. Confirmation de succès
```

---

## 4. Champs du formulaire non envoyés au backend

Les champs suivants sont dans le formulaire mais **ne sont pas envoyés** au backend :

- `activerImmediat` : Non utilisé dans le payload
- `challengePrive` : Non utilisé dans le payload

Ces champs peuvent être utilisés pour la logique frontend uniquement.

---

## 5. Résumé des données complètes

### Challenge
- ✅ `titre` (string, requis)
- ✅ `description` (string, optionnel)
- ✅ `points` (number, requis, ≥ 0)
- ✅ `dateDebut` (string, requis, format LocalDateTime)
- ✅ `dateFin` (string, requis, format LocalDateTime)
- ✅ `typeChallenge` ("INTERCLASSE" | "INTERNIVEAU", requis)
- ✅ `rewardMode` ("STANDARD" | "TOP3", requis)
- ✅ `winnersCount` (number, requis, ≥ 1)
- ✅ `niveau` (objet avec `id`, optionnel)
- ✅ `classe` (objet avec `id`, optionnel)
- ✅ `badgeIds` (number[], optionnel)

### Questions (pour chaque question)
- ✅ `challengeId` (number, requis)
- ✅ `enonce` (string, requis, min 5 caractères)
- ✅ `points` (number, optionnel, défaut 1, ≥ 1)
- ✅ `type` ("QCU" | "QCM" | "VRAI_FAUX" | "APPARIEMENT", requis)
- ✅ `reponses` (array, requis)
  - `libelle` (string, requis)
  - `estCorrecte` (boolean, requis)

---

## 6. Validation côté frontend

### Challenge
- `titre` : Requis, minimum 3 caractères
- `dateDebut` : Requis
- `dateFin` : Requis
- `rewardMode` : Requis
- `winnersCount` : Requis, minimum 1
- `points` : Requis, minimum 0

### Questions
- Au moins 1 question requise
- Chaque question doit avoir :
  - `typeQuestion` : Requis
  - `question` (enonce) : Requis, minimum 5 caractères
  - `points` : Minimum 1
  - Pour QCU/QCM : Au moins 2 réponses
  - Pour APPARIEMENT : Au moins 2 paires
  - Pour VRAI_FAUX : 2 réponses fixes (VRAI/FAUX)

---

## 7. Exemple complet de scénario réel

### Étape 1 : Création du Challenge

**POST** `/api/admin/challenges`

```json
{
  "titre": "Challenge de Mathématiques - Niveau Terminale",
  "description": "Testez vos connaissances en algèbre et géométrie",
  "points": 150,
  "dateDebut": "2024-12-20T09:00:00",
  "dateFin": "2024-12-27T17:00:00",
  "typeChallenge": "INTERCLASSE",
  "rewardMode": "TOP3",
  "winnersCount": 3,
  "niveau": {
    "id": 3
  },
  "badgeIds": [2, 4]
}
```

**Réponse attendue :**
```json
{
  "id": 456,
  "titre": "Challenge de Mathématiques - Niveau Terminale",
  ...
}
```

### Étape 2 : Création des Questions (3 questions en parallèle)

**POST** `/api/questions` (Question 1 - QCU)
```json
{
  "challengeId": 456,
  "enonce": "Quelle est la solution de l'équation 2x + 5 = 13 ?",
  "points": 10,
  "type": "QCU",
  "reponses": [
    { "libelle": "x = 4", "estCorrecte": true },
    { "libelle": "x = 5", "estCorrecte": false },
    { "libelle": "x = 6", "estCorrecte": false },
    { "libelle": "x = 7", "estCorrecte": false }
  ]
}
```

**POST** `/api/questions` (Question 2 - QCM)
```json
{
  "challengeId": 456,
  "enonce": "Quelles sont les propriétés d'un carré ? (Plusieurs réponses possibles)",
  "points": 15,
  "type": "QCM",
  "reponses": [
    { "libelle": "4 côtés égaux", "estCorrecte": true },
    { "libelle": "4 angles droits", "estCorrecte": true },
    { "libelle": "3 côtés", "estCorrecte": false },
    { "libelle": "Diagonales perpendiculaires", "estCorrecte": true }
  ]
}
```

**POST** `/api/questions` (Question 3 - VRAI_FAUX)
```json
{
  "challengeId": 456,
  "enonce": "La somme des angles d'un triangle est toujours égale à 180°",
  "points": 5,
  "type": "VRAI_FAUX",
  "reponses": [
    { "libelle": "VRAI", "estCorrecte": true },
    { "libelle": "FAUX", "estCorrecte": false }
  ]
}
```

---

## 8. Structure complète des données (JSON Schema)

### Challenge Request Schema
```json
{
  "type": "object",
  "required": ["titre", "dateDebut", "dateFin", "typeChallenge", "rewardMode", "winnersCount", "points"],
  "properties": {
    "titre": {
      "type": "string",
      "minLength": 3
    },
    "description": {
      "type": "string"
    },
    "points": {
      "type": "number",
      "minimum": 0
    },
    "dateDebut": {
      "type": "string",
      "pattern": "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}$"
    },
    "dateFin": {
      "type": "string",
      "pattern": "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}$"
    },
    "typeChallenge": {
      "type": "string",
      "enum": ["INTERCLASSE", "INTERNIVEAU"]
    },
    "rewardMode": {
      "type": "string",
      "enum": ["STANDARD", "TOP3"]
    },
    "winnersCount": {
      "type": "number",
      "minimum": 1
    },
    "niveau": {
      "type": "object",
      "properties": {
        "id": {
          "type": "number"
        }
      },
      "required": ["id"]
    },
    "classe": {
      "type": "object",
      "properties": {
        "id": {
          "type": "number"
        }
      },
      "required": ["id"]
    },
    "badgeIds": {
      "type": "array",
      "items": {
        "type": "number"
      },
      "default": []
    }
  }
}
```

### Question Request Schema
```json
{
  "type": "object",
  "required": ["challengeId", "enonce", "type", "reponses"],
  "properties": {
    "challengeId": {
      "type": "number"
    },
    "enonce": {
      "type": "string",
      "minLength": 5
    },
    "points": {
      "type": "number",
      "minimum": 1,
      "default": 1
    },
    "type": {
      "type": "string",
      "enum": ["QCU", "QCM", "VRAI_FAUX", "APPARIEMENT"]
    },
    "reponses": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "required": ["libelle", "estCorrecte"],
        "properties": {
          "libelle": {
            "type": "string"
          },
          "estCorrecte": {
            "type": "boolean"
          }
        }
      }
    }
  }
}
```

---

## 9. Attribution automatique des badges aux gagnants

### 🎯 Objectif

Lorsqu'un challenge est terminé (après la `dateFin`), le backend doit **automatiquement attribuer les badges** (`badgeIds`) aux gagnants du challenge selon le mode de récompense configuré.

### 📋 Logique d'attribution

#### 1. Détermination des gagnants

Les gagnants sont déterminés selon le `rewardMode` et le `winnersCount` :

**Mode `STANDARD` :**
- Tous les participants qui ont complété le challenge reçoivent les badges
- Pas de classement nécessaire

**Mode `TOP3` :**
- Seuls les `winnersCount` premiers participants (selon leur score et/ou temps) reçoivent les badges
- Les participants sont classés par :
  1. **Score** (décroissant) - priorité principale
  2. **Temps passé** (croissant) - en cas d'égalité de score
  3. **Date de participation** (croissante) - en cas d'égalité de score et temps

#### 2. Attribution des badges

Pour chaque gagnant identifié :

1. **Récupérer les `badgeIds`** du challenge
2. **Créer une `Participation`** (ou mettre à jour si elle existe) avec :
   - `challenge.id` : ID du challenge
   - `eleve.id` : ID de l'élève gagnant
   - `badge.id` : ID de chaque badge à attribuer
   - `rang` : Position dans le classement (1, 2, 3, etc.)
   - `score` : Score obtenu
   - `statut` : "GAGNANT" ou "PARTICIPANT"

3. **Associer tous les badges** de `badgeIds` à chaque gagnant

### ⚙️ Déclenchement automatique

L'attribution doit se faire automatiquement dans les cas suivants :

1. **À la fin du challenge** : Lorsque `dateFin` est atteinte
   - Un job/cron peut vérifier périodiquement les challenges terminés
   - Ou un événement peut être déclenché à la fin du challenge

2. **Lors de la dernière participation** : Si tous les participants ont terminé avant `dateFin`
   - Optionnel : peut déclencher l'attribution immédiatement

3. **Manuellement** : Via un endpoint admin pour forcer l'attribution
   - `POST /api/admin/challenges/{id}/attribuer-badges`

### 📝 Exemple de logique backend

```java
// Pseudo-code pour l'attribution automatique
public void attribuerBadgesAutomatiquement(Long challengeId) {
    Challenge challenge = challengeRepository.findById(challengeId)
        .orElseThrow(() -> new NotFoundException("Challenge non trouvé"));
    
    // Vérifier que le challenge est terminé
    if (LocalDateTime.now().isBefore(challenge.getDateFin())) {
        throw new BadRequestException("Le challenge n'est pas encore terminé");
    }
    
    // Récupérer toutes les participations avec scores
    List<Participation> participations = participationRepository
        .findByChallengeId(challengeId)
        .stream()
        .filter(p -> p.getScore() != null) // Seulement ceux qui ont complété
        .collect(Collectors.toList());
    
    List<Long> badgeIds = challenge.getBadgeIds(); // Récupérer depuis le challenge
    
    if (badgeIds == null || badgeIds.isEmpty()) {
        return; // Aucun badge à attribuer
    }
    
    List<Participation> gagnants;
    
    if ("STANDARD".equals(challenge.getRewardMode())) {
        // Tous les participants sont gagnants
        gagnants = participations;
    } else if ("TOP3".equals(challenge.getRewardMode())) {
        // Classer et prendre les N premiers
        gagnants = participations.stream()
            .sorted(Comparator
                .comparing(Participation::getScore, Comparator.reverseOrder())
                .thenComparing(Participation::getTempsPasse)
                .thenComparing(Participation::getDateParticipation))
            .limit(challenge.getWinnersCount() != null ? challenge.getWinnersCount() : 1)
            .collect(Collectors.toList());
    } else {
        return; // Mode non reconnu
    }
    
    // Attribuer les badges à chaque gagnant
    int rang = 1;
    for (Participation participation : gagnants) {
        participation.setRang(rang++);
        participation.setStatut("GAGNANT");
        
        // Attribuer chaque badge
        for (Long badgeId : badgeIds) {
            Badge badge = badgeRepository.findById(badgeId)
                .orElseThrow(() -> new NotFoundException("Badge non trouvé: " + badgeId));
            
            // Créer ou mettre à jour la relation Participation-Badge
            participation.setBadge(badge);
            participationRepository.save(participation);
        }
    }
}
```

### 🔄 Endpoint recommandé pour déclenchement manuel

Si le backend doit exposer un endpoint pour déclencher manuellement l'attribution :

```
POST /api/admin/challenges/{challengeId}/attribuer-badges
```

**Réponse :**
```json
{
  "message": "Badges attribués avec succès",
  "nombreGagnants": 3,
  "badgesAttribues": [1, 3, 5]
}
```

### ✅ Vérifications importantes

1. **Ne pas attribuer deux fois** : Vérifier que les badges n'ont pas déjà été attribués
2. **Gérer les égalités** : En cas d'égalité de score, tous les participants à égalité peuvent recevoir les badges (ou selon la règle métier)
3. **Badges valides** : Vérifier que tous les `badgeIds` existent avant l'attribution
4. **Challenge terminé** : Ne pas attribuer avant la fin du challenge (sauf si mode manuel)

### 📊 Structure de données

La table `Participation` doit contenir :
- `id` : ID de la participation
- `challenge_id` : Référence au challenge
- `eleve_id` : Référence à l'élève
- `badge_id` : Référence au badge (peut être NULL si pas encore attribué)
- `score` : Score obtenu
- `rang` : Position dans le classement
- `temps_passe` : Temps passé sur le challenge
- `statut` : "GAGNANT", "PARTICIPANT", etc.
- `date_participation` : Date de participation

**Note** : Si un élève peut recevoir plusieurs badges pour un même challenge, il faudra peut-être une table de liaison `participation_badges` au lieu d'un seul `badge_id`.

---

Cette documentation couvre toutes les informations envoyées au backend lors de la création complète d'un challenge avec ses questions, ainsi que la logique d'attribution automatique des badges aux gagnants.

