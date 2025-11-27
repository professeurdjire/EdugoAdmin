# Documentation Backend - Attribution Automatique des Badges

## 📋 Vue d'ensemble

Ce document décrit comment le backend doit implémenter l'**attribution automatique des badges** aux gagnants d'un challenge lorsque celui-ci est terminé.

---

## 🎯 Fonctionnalité

Lorsqu'un challenge est terminé (après la `dateFin`), le backend doit automatiquement :

1. **Déterminer les gagnants** selon le `rewardMode` et `winnersCount`
2. **Attribuer les badges** (`badgeIds`) à chaque gagnant
3. **Mettre à jour les participations** avec le rang et le statut

---

## 🔧 Implémentation Backend

### 1. Structure de données

#### Table `challenges`
```sql
CREATE TABLE challenges (
    id BIGINT PRIMARY KEY,
    titre VARCHAR(255) NOT NULL,
    description TEXT,
    points INTEGER,
    date_debut TIMESTAMP NOT NULL,
    date_fin TIMESTAMP NOT NULL,
    type_challenge VARCHAR(50) NOT NULL, -- 'INTERCLASSE' ou 'INTERNIVEAU'
    reward_mode VARCHAR(50) NOT NULL,   -- 'STANDARD' ou 'TOP3'
    winners_count INTEGER,               -- Nombre de gagnants (pour TOP3)
    badge_ids TEXT,                      -- JSON array: [1, 3, 5] ou NULL
    -- autres champs...
);
```

**Note** : `badge_ids` peut être stocké comme :
- Un champ JSON/ARRAY (PostgreSQL)
- Un champ TEXT avec JSON (MySQL)
- Une table de liaison `challenge_badges` (recommandé pour normalisation)

#### Table `participations`
```sql
CREATE TABLE participations (
    id BIGINT PRIMARY KEY,
    challenge_id BIGINT NOT NULL,
    eleve_id BIGINT NOT NULL,
    badge_id BIGINT,                     -- Badge attribué (peut être NULL)
    score INTEGER,
    rang INTEGER,                        -- Position dans le classement
    temps_passe INTEGER,                 -- En secondes
    statut VARCHAR(50),                  -- 'GAGNANT', 'PARTICIPANT', etc.
    date_participation TIMESTAMP,
    FOREIGN KEY (challenge_id) REFERENCES challenges(id),
    FOREIGN KEY (eleve_id) REFERENCES eleves(id),
    FOREIGN KEY (badge_id) REFERENCES badges(id)
);
```

**Note** : Si un élève peut recevoir plusieurs badges pour un même challenge, utilisez une table de liaison :
```sql
CREATE TABLE participation_badges (
    participation_id BIGINT,
    badge_id BIGINT,
    PRIMARY KEY (participation_id, badge_id),
    FOREIGN KEY (participation_id) REFERENCES participations(id),
    FOREIGN KEY (badge_id) REFERENCES badges(id)
);
```

---

## 📝 Logique d'attribution

### Algorithme principal

```java
@Service
public class BadgeAttributionService {
    
    @Autowired
    private ChallengeRepository challengeRepository;
    
    @Autowired
    private ParticipationRepository participationRepository;
    
    @Autowired
    private BadgeRepository badgeRepository;
    
    /**
     * Attribue automatiquement les badges aux gagnants d'un challenge terminé
     */
    @Transactional
    public void attribuerBadgesAutomatiquement(Long challengeId) {
        Challenge challenge = challengeRepository.findById(challengeId)
            .orElseThrow(() -> new NotFoundException("Challenge non trouvé: " + challengeId));
        
        // Vérifier que le challenge est terminé
        if (LocalDateTime.now().isBefore(challenge.getDateFin())) {
            throw new BadRequestException(
                "Le challenge n'est pas encore terminé. Date de fin: " + challenge.getDateFin()
            );
        }
        
        // Vérifier que les badges n'ont pas déjà été attribués
        if (sontBadgesDejaAttribues(challengeId)) {
            log.warn("Les badges ont déjà été attribués pour le challenge {}", challengeId);
            return; // Ou lever une exception selon le besoin
        }
        
        // Récupérer les badgeIds
        List<Long> badgeIds = challenge.getBadgeIds();
        if (badgeIds == null || badgeIds.isEmpty()) {
            log.info("Aucun badge à attribuer pour le challenge {}", challengeId);
            return;
        }
        
        // Vérifier que tous les badges existent
        validerBadges(badgeIds);
        
        // Récupérer toutes les participations complètes
        List<Participation> participations = participationRepository
            .findByChallengeId(challengeId)
            .stream()
            .filter(p -> p.getScore() != null) // Seulement ceux qui ont complété
            .collect(Collectors.toList());
        
        if (participations.isEmpty()) {
            log.info("Aucune participation complète pour le challenge {}", challengeId);
            return;
        }
        
        // Déterminer les gagnants
        List<Participation> gagnants = determinerGagnants(challenge, participations);
        
        // Attribuer les badges
        attribuerBadgesAuxGagnants(gagnants, badgeIds);
        
        log.info("Badges attribués avec succès: {} gagnants, {} badges", 
                 gagnants.size(), badgeIds.size());
    }
    
    /**
     * Détermine les gagnants selon le rewardMode
     */
    private List<Participation> determinerGagnants(
            Challenge challenge, 
            List<Participation> participations) {
        
        if ("STANDARD".equals(challenge.getRewardMode())) {
            // Tous les participants sont gagnants
            return participations;
            
        } else if ("TOP3".equals(challenge.getRewardMode())) {
            // Classer et prendre les N premiers
            int winnersCount = challenge.getWinnersCount() != null 
                ? challenge.getWinnersCount() 
                : 1; // Par défaut, seulement le premier
            
            return participations.stream()
                .sorted(Comparator
                    // 1. Par score décroissant (meilleur score en premier)
                    .comparing(Participation::getScore, 
                              Comparator.nullsLast(Comparator.reverseOrder()))
                    // 2. Par temps passé croissant (plus rapide en premier)
                    .thenComparing(Participation::getTempsPasse, 
                                  Comparator.nullsLast(Comparator.naturalOrder()))
                    // 3. Par date de participation croissante (premier arrivé en premier)
                    .thenComparing(Participation::getDateParticipation, 
                                  Comparator.nullsLast(Comparator.naturalOrder())))
                .limit(winnersCount)
                .collect(Collectors.toList());
        } else {
            throw new IllegalArgumentException(
                "Mode de récompense non reconnu: " + challenge.getRewardMode()
            );
        }
    }
    
    /**
     * Attribue les badges à chaque gagnant
     */
    private void attribuerBadgesAuxGagnants(
            List<Participation> gagnants, 
            List<Long> badgeIds) {
        
        int rang = 1;
        for (Participation participation : gagnants) {
            // Mettre à jour le rang et le statut
            participation.setRang(rang++);
            participation.setStatut("GAGNANT");
            
            // Attribuer chaque badge
            for (Long badgeId : badgeIds) {
                Badge badge = badgeRepository.findById(badgeId)
                    .orElseThrow(() -> new NotFoundException("Badge non trouvé: " + badgeId));
                
                // Si un seul badge par participation
                participation.setBadge(badge);
                
                // OU si plusieurs badges possibles, utiliser une table de liaison
                // participationBadgeRepository.save(
                //     new ParticipationBadge(participation, badge)
                // );
            }
            
            participationRepository.save(participation);
        }
    }
    
    /**
     * Valide que tous les badges existent
     */
    private void validerBadges(List<Long> badgeIds) {
        for (Long badgeId : badgeIds) {
            if (!badgeRepository.existsById(badgeId)) {
                throw new NotFoundException("Badge non trouvé: " + badgeId);
            }
        }
    }
    
    /**
     * Vérifie si les badges ont déjà été attribués
     */
    private boolean sontBadgesDejaAttribues(Long challengeId) {
        // Vérifier si au moins une participation a un badge attribué
        return participationRepository
            .findByChallengeId(challengeId)
            .stream()
            .anyMatch(p -> p.getBadge() != null || "GAGNANT".equals(p.getStatut()));
    }
}
```

---

## ⏰ Déclenchement automatique

### Option 1 : Job/Cron périodique (Recommandé)

```java
@Component
public class BadgeAttributionScheduler {
    
    @Autowired
    private BadgeAttributionService badgeAttributionService;
    
    @Autowired
    private ChallengeRepository challengeRepository;
    
    /**
     * Vérifie toutes les heures les challenges terminés
     */
    @Scheduled(cron = "0 0 * * * ?") // Toutes les heures
    public void verifierChallengesTermines() {
        LocalDateTime maintenant = LocalDateTime.now();
        
        // Récupérer tous les challenges terminés mais pas encore traités
        List<Challenge> challengesTermines = challengeRepository
            .findByDateFinBeforeAndBadgesAttribuesFalse(maintenant);
        
        for (Challenge challenge : challengesTermines) {
            try {
                badgeAttributionService.attribuerBadgesAutomatiquement(challenge.getId());
                // Marquer comme traité
                challenge.setBadgesAttribues(true);
                challengeRepository.save(challenge);
            } catch (Exception e) {
                log.error("Erreur lors de l'attribution des badges pour le challenge {}", 
                         challenge.getId(), e);
            }
        }
    }
}
```

### Option 2 : Événement à la fin du challenge

```java
@EventListener
public void onChallengeTermine(ChallengeTermineEvent event) {
    try {
        badgeAttributionService.attribuerBadgesAutomatiquement(event.getChallengeId());
    } catch (Exception e) {
        log.error("Erreur lors de l'attribution automatique des badges", e);
    }
}
```

### Option 3 : Vérification lors de la dernière participation

```java
@Service
public class ParticipationService {
    
    @Autowired
    private BadgeAttributionService badgeAttributionService;
    
    public Participation completerParticipation(Long participationId, Integer score) {
        Participation participation = participationRepository.findById(participationId)
            .orElseThrow();
        
        participation.setScore(score);
        participation.setStatut("TERMINE");
        participationRepository.save(participation);
        
        // Vérifier si c'est la dernière participation et si le challenge est terminé
        Challenge challenge = participation.getChallenge();
        if (LocalDateTime.now().isAfter(challenge.getDateFin())) {
            // Vérifier si tous les participants ont terminé
            long participationsIncompletes = participationRepository
                .countByChallengeIdAndScoreIsNull(challenge.getId());
            
            if (participationsIncompletes == 0) {
                // Tous ont terminé, attribuer les badges
                badgeAttributionService.attribuerBadgesAutomatiquement(challenge.getId());
            }
        }
        
        return participation;
    }
}
```

---

## 🔌 Endpoint Admin (Optionnel)

Pour permettre un déclenchement manuel depuis l'admin :

```java
@RestController
@RequestMapping("/api/admin/challenges")
public class ChallengeAdminController {
    
    @Autowired
    private BadgeAttributionService badgeAttributionService;
    
    /**
     * Attribue manuellement les badges aux gagnants d'un challenge
     * POST /api/admin/challenges/{challengeId}/attribuer-badges
     */
    @PostMapping("/{challengeId}/attribuer-badges")
    public ResponseEntity<Map<String, Object>> attribuerBadges(
            @PathVariable Long challengeId) {
        
        try {
            badgeAttributionService.attribuerBadgesAutomatiquement(challengeId);
            
            // Compter les gagnants
            long nombreGagnants = participationRepository
                .countByChallengeIdAndStatut(challengeId, "GAGNANT");
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Badges attribués avec succès");
            response.put("nombreGagnants", nombreGagnants);
            response.put("challengeId", challengeId);
            
            return ResponseEntity.ok(response);
            
        } catch (BadRequestException e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
        } catch (NotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Erreur lors de l'attribution des badges", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Erreur serveur lors de l'attribution des badges"));
        }
    }
}
```

---

## ✅ Cas limites à gérer

### 1. Égalités de score

**Option A** : Tous les participants à égalité reçoivent les badges
```java
// Si plusieurs participants ont le même score au rang N
// et que winnersCount = 3, mais qu'il y a 5 participants avec le même score
// Tous les 5 reçoivent les badges
```

**Option B** : Seuls les N premiers reçoivent les badges (même en cas d'égalité)
```java
// Limiter strictement à winnersCount, même si plusieurs ont le même score
.limit(winnersCount)
```

### 2. Challenge sans participants

Si aucun participant n'a complété le challenge, aucun badge n'est attribué.

### 3. Challenge sans badges

Si `badgeIds` est vide ou null, la méthode retourne sans erreur.

### 4. Double attribution

Vérifier que les badges n'ont pas déjà été attribués pour éviter les doublons.

### 5. Challenge non terminé

Ne pas attribuer avant la `dateFin` (sauf si déclenchement manuel avec override).

---

## 📊 Exemple de résultat

Après attribution, les participations auront :

| eleve_id | challenge_id | score | rang | statut | badge_id |
|----------|--------------|-------|------|--------|----------|
| 101      | 123          | 95    | 1    | GAGNANT | 1        |
| 101      | 123          | 95    | 1    | GAGNANT | 3        |
| 101      | 123          | 95    | 1    | GAGNANT | 5        |
| 102      | 123          | 88    | 2    | GAGNANT | 1        |
| 102      | 123          | 88    | 2    | GAGNANT | 3        |
| 102      | 123          | 88    | 2    | GAGNANT | 5        |
| 103      | 123          | 85    | 3    | GAGNANT | 1        |
| 103      | 123          | 85    | 3    | GAGNANT | 3        |
| 103      | 123          | 85    | 3    | GAGNANT | 5        |
| 104      | 123          | 80    | NULL | PARTICIPANT | NULL |

*(Si plusieurs badges, utiliser une table de liaison `participation_badges`)*

---

## 🧪 Tests recommandés

```java
@Test
public void testAttributionBadgesModeStandard() {
    // Tous les participants reçoivent les badges
}

@Test
public void testAttributionBadgesModeTop3() {
    // Seuls les 3 premiers reçoivent les badges
}

@Test
public void testAttributionBadgesEgalite() {
    // Gérer les égalités de score
}

@Test
public void testAttributionBadgesChallengeNonTermine() {
    // Ne pas attribuer avant dateFin
}

@Test
public void testAttributionBadgesDejaAttribues() {
    // Ne pas attribuer deux fois
}

@Test
public void testAttributionBadgesSansBadges() {
    // Pas d'erreur si badgeIds est vide
}
```

---

## 📝 Checklist d'implémentation

- [ ] Ajouter le champ `badge_ids` dans la table `challenges`
- [ ] Créer le service `BadgeAttributionService`
- [ ] Implémenter la logique de détermination des gagnants
- [ ] Implémenter l'attribution des badges
- [ ] Créer un job/cron pour vérifier les challenges terminés
- [ ] Ajouter l'endpoint admin (optionnel)
- [ ] Gérer les cas limites (égalités, double attribution, etc.)
- [ ] Ajouter les tests unitaires
- [ ] Ajouter les logs pour le monitoring
- [ ] Documenter l'API

---

Cette documentation fournit une base complète pour implémenter l'attribution automatique des badges côté backend.

