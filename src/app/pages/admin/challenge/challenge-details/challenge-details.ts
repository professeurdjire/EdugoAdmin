import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-challenge-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './challenge-details.html',
  styleUrls: ['./challenge-details.css'],
})
export class ChallengeDetails {
  // Données simulées pour la liste des challenges
  challenges = Array(12).fill(0).map((_, i) => ({
    id: i + 1,
    nom: 'Défis Mathematiques Express',
    description: 'Devenez incontournable en math!',
    type: '4 ème',
    matiere: 'mathématiques',
    date: '10/10/2025',
    difficulte: 'Moyenne',
    statut: i === 0 ? 'Encours' : i === 1 ? 'Terminé' : 'Pas debuté'
  }));

  // Méthodes pour les actions
  onView(challenge: any) {
    console.log('Voir le challenge:', challenge);
  }

  onEdit(challenge: any) {
    console.log('Modifier le challenge:', challenge);
  }

  onDelete(challenge: any) {
    console.log('Supprimer le challenge:', challenge);
  }

  onFilter() {
    console.log('Filtrer la liste');
  }

  onRefresh() {
    console.log('Actualiser la liste');
  }

  onToutVoir() {
    console.log('Tout voir');
  }

  onPageChange(page: number) {
    console.log('Changer de page:', page);
  }
}
