import {Component, OnInit} from '@angular/core';
import {faBook, faBookOpen, faDownload, faEye} from '@fortawesome/free-solid-svg-icons';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {FaIconComponent} from '@fortawesome/angular-fontawesome';
import {RouterLink} from '@angular/router';

@Component({
  selector: 'app-livre-list',
  imports: [CommonModule, FormsModule, FaIconComponent, RouterLink],
  standalone: true,
  templateUrl: './livre-list.html',
  styleUrl: './livre-list.css'
})
export class LivreList  {
  // Statistiques
  stats = [
    { label: 'Livres Disponibles', value: 10000, icon: faBook, color: '#7b4fff', bgColor: '#ede7ff' },
    { label: 'Catégories', value: 10000, icon: faBookOpen, color: '#4caf50', bgColor: '#e8f5e9' },
    { label: 'Téléchargements', value: 10000, icon: faDownload, color: '#ff9800', bgColor: '#fff3e0' },
    { label: 'Lecture en Ligne', value: 10000, icon: faEye, color: '#03a9f4', bgColor: '#e1f5fe' },
  ];

  // Filtres
  searchTerm = '';
  niveaux = ['6e', '5e', '4e', '3e', '2nde', '1ère', 'Terminale'];
  matieres = ['Mathématiques', 'Physique', 'SVT', 'Histoire', 'Français'];
  selectedNiveau = '';
  selectedMatiere = '';

  // Données simulées
  livres = Array(8).fill(0).map(() => ({
    titre: 'Mathématiques 4ème',
    auteur: 'Issa Traoré',
    pages: 356,
    matiere: 'Mathématiques'
  }));

  // Pagination
  page = 1;
  totalPages = 10;
  get totalPagesArray() {
    return Array(this.totalPages).fill(0).map((_, i) => i + 1);
  }

  get livresFiltres() {
    return this.livres.filter(l =>
      (!this.searchTerm || l.titre.toLowerCase().includes(this.searchTerm.toLowerCase())) &&
      (!this.selectedNiveau || this.selectedNiveau === '4e') &&
      (!this.selectedMatiere || l.matiere === this.selectedMatiere)
    );
  }

  nextPage() {
    if (this.page < this.totalPages) this.page++;
  }

  prevPage() {
    if (this.page > 1) this.page--;
  }

  goToPage(p: number) {
    this.page = p;
  }

  protected readonly faEye = faEye;
  protected readonly faDownload = faDownload;
  protected readonly faBookOpen = faBookOpen;
}
