/**
 * Statistiques par matière - modèle frontend
 * Doit être cohérent avec la réponse JSON du backend.
 */

export interface StatistiquesMatiereResponse {
  matiereId?: number;
  nomMatiere?: string;
  nombreEleves?: number;
  nombreLivres?: number;
  nombreExercices?: number;
  nombreExercicesActifs?: number;
}
