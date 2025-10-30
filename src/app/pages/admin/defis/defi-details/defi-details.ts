import {Component} from '@angular/core';
import {CommonModule} from '@angular/common';


@Component({
  selector: 'app-defi-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './defi-details.html',
  styleUrls: ['./defi-details.css'],
})
export class DefiDetails {
  // Données simulées pour la liste des défis
  defis = Array(12).fill(0).map((_, i) => ({
    id: i + 1,
    nom: 'Défis Mathematiques Express',
    description: 'Devenez incontournable en math!',
    niveau: '4 ème',
    matiere: 'mathématiques',
    date: '10/10/2025',
    difficulte: 'Moyenne',
    statut: 'Actif'
  }));

  // Méthodes pour les actions
  onView(defi: any) {
    console.log('Voir le défi:', defi);
  }

  onEdit(defi: any) {
    console.log('Modifier le défi:', defi);
  }

  onDelete(defi: any) {
    console.log('Supprimer le défi:', defi);
  }

  onFilter() {
    console.log('Filtrer la liste');
  }

  onRefresh() {
    console.log('Actualiser la liste');
  }

  onPageChange(page: number) {
    console.log('Changer de page:', page);
  }
}
