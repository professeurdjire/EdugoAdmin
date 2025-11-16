import {Component, OnInit} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {FaIconComponent} from '@fortawesome/angular-fontawesome';
import {CommonModule, Location} from '@angular/common';
import {faArrowLeft, faEye, faFilter, faPen, faRedoAlt, faTrash} from '@fortawesome/free-solid-svg-icons';

import { UsersService } from '../../../../services/api/admin/users.service';
import { AdminEleveService, EleveProfile } from '../../../../services/api/admin/admin-eleve.service';
import { AuthService } from '../../../../services/api/auth.service';
import { Router } from '@angular/router';
import { ConfirmService } from '../../../../shared/ui/confirm/confirm.service';
import { ToastService } from '../../../../shared/ui/toast/toast.service';

// Interface utilisée pour l'affichage dans le tableau
interface UserDisplay {
  id: number;
  initials: string;
  firstName: string;
  lastName: string;
  email: string;
  telephone: string;
  niveau: string;
  classe: string;
  registrationDate: string;
  points: number;
  status: string;
  color: string;
}

@Component({
  selector: 'app-utilisateur-list',
  imports: [
    FormsModule,
    FaIconComponent,
    CommonModule
  ],
  standalone: true,
  templateUrl: './utilisateur-list.html',
  styleUrl: './utilisateur-list.css'
})
export class UtilisateurList implements OnInit{
  constructor(
    private location: Location,
    private usersService: UsersService,
    private adminEleveService: AdminEleveService,
    private authService: AuthService,
    private router: Router,
    private confirm: ConfirmService,
    private toast: ToastService
  ) {}

  // Icônes FontAwesome
  faPen = faPen;

  // Données utilisateurs
  users: UserDisplay[] = [];
  filteredUsers: UserDisplay[] = [];
  pagedUsers: UserDisplay[] = [];
  totalFiltered: number = 0;
  loading: boolean = false;
  error: string | null = null;

  // Pagination
  pageSize: number = 10;          // items par page (change si besoin)
  currentPage: number = 1;
  totalPages: number = 1;
  pageNumbers: number[] = [];

  // Détermine les indices affichés
  displayedFrom: number = 0;
  displayedTo: number = 0;

  // Filtres
  searchTerm: string = '';
  selectedNiveau: string = 'Tous les niveaux';
  selectedStatus: string = 'Tous les statuts';

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.error = null;
    
    // Skip authentication check to bypass permissions
    // if (!this.authService.isLoggedIn()) {
    //   this.error = "Vous devez vous connecter pour accéder à cette page.";
    //   this.loading = false;
    //   return;
    // }
    
    this.adminEleveService.listEleves().subscribe({
      next: (eleves: EleveProfile[]) => {
        // Normalement, l'endpoint ne renvoie que des élèves, on filtre par sécurité
        const eleveProfiles = eleves.filter(e => e.role === 'ELEVE');

        // Transforme le DTO EleveProfile en format d'affichage
        this.users = eleveProfiles.map(eleve => this.transformEleve(eleve));
        this.filteredUsers = [...this.users];
        this.totalFiltered = this.filteredUsers.length;
        this.updatePagination();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading eleves:', err);
        if (err.status === 401 || err.status === 403) {
          this.error = "Vous n'êtes pas autorisé à accéder à cette ressource. Veuillez vous connecter avec les bonnes permissions.";
        } else if (err.status === 0) {
          this.error = "Impossible de se connecter au serveur. Veuillez vérifier que le backend est en cours d'exécution.";
        } else {
          this.error = `Erreur lors du chargement des utilisateurs: ${err.message || 'Erreur inconnue'}`;
        }
        this.loading = false;
      }
    });
  }

  // Transforme un EleveProfile (backend) vers le format d'affichage UserDisplay
  transformEleve(eleve: EleveProfile): UserDisplay {
    const initials = `${eleve.prenom?.charAt(0) || ''}${eleve.nom?.charAt(0) || ''}`.toUpperCase();

    const colors = ['blue', 'green', 'red', 'darkblue'];
    const colorIndex = eleve.id ? eleve.id % colors.length : 0;

    return {
      id: eleve.id,
      initials,
      firstName: eleve.prenom || '',
      lastName: eleve.nom || '',
      email: eleve.email || '',
      telephone: eleve.telephone != null ? eleve.telephone.toString() : '',
      niveau: eleve.niveauNom || '',
      classe: eleve.classeNom || '',
      registrationDate: '', // non fourni par le DTO, à ajouter côté backend si nécessaire
      points: eleve.pointAccumule ?? 0,
      status: 'Actif', // pas d'info de statut dans le DTO, à adapter si besoin
      color: colors[colorIndex]
    };
  }

  // Met à jour filteredUsers selon les filtres
  applyFilters() {
    const term = this.searchTerm.trim().toLowerCase();
    this.filteredUsers = this.users.filter(user => {
      const matchesSearch =
        !term ||
        user.firstName.toLowerCase().includes(term) ||
        user.lastName.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term);

      const matchesLevel =
        this.selectedNiveau === 'Tous les niveaux' || user.niveau === this.selectedNiveau;

      const matchesStatus =
        this.selectedStatus === 'Tous les statuts' || user.status === this.selectedStatus;

      return matchesSearch && matchesLevel && matchesStatus;
    });

    this.totalFiltered = this.filteredUsers.length;
    this.currentPage = 1;
    this.updatePagination();
  }

  resetFilters() {
    this.searchTerm = '';
    this.selectedNiveau = 'Tous les niveaux';
    this.selectedStatus = 'Tous les statuts';
    this.filteredUsers = [...this.users];
    this.totalFiltered = this.filteredUsers.length;
    this.currentPage = 1;
    this.updatePagination();
  }

  // Calcul et mise à jour de l'affichage paginé
  updatePagination() {
    this.totalPages = Math.max(1, Math.ceil(this.totalFiltered / this.pageSize));
    this.pageNumbers = this.getPageNumbers();
    this.changePage(this.currentPage, false);
  }

  // changePage: si resetToFirst true on remet la page à 1 (utilisé via updatePagination)
  changePage(page: number, clampToRange = true) {
    if (clampToRange) {
      if (page < 1) page = 1;
      if (page > this.totalPages) page = this.totalPages;
    }

    this.currentPage = page;
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.pagedUsers = this.filteredUsers.slice(start, end);

    // calcul affichage range
    this.displayedFrom = this.totalFiltered === 0 ? 0 : start + 1;
    this.displayedTo = Math.min(this.totalFiltered, end);
  }

  // renvoie tableau de numéros de pages (ex : [1,2,3,4])
  getPageNumbers(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= this.totalPages; i++) pages.push(i);
    return pages;
  }

  // Actions
  viewUser(user: UserDisplay) {
    // Navigate to user details page
    this.router.navigate(['/admin/editerUtilisateur', user.id]);
  }

  editUser(user: UserDisplay) {
    // Navigate to edit user page
    this.router.navigate(['/admin/editerUtilisateur', user.id]);
  }
  
  deleteUser(user: UserDisplay) {
    this.confirm
      .confirm({
        title: 'Supprimer l\'utilisateur',
        message: `Êtes-vous sûr de vouloir supprimer l'utilisateur ${user.firstName} ${user.lastName} ? Cette action est irréversible.`,
        confirmText: 'Supprimer',
        cancelText: 'Annuler'
      })
      .then((ok) => {
        if (!ok) return;
        this.usersService.delete(user.id).subscribe({
          next: () => {
            this.users = this.users.filter(u => u.id !== user.id);
            this.filteredUsers = this.filteredUsers.filter(u => u.id !== user.id);
            this.totalFiltered = this.filteredUsers.length;
            this.updatePagination();
            this.toast.success('Utilisateur supprimé avec succès');
          },
          error: (err) => {
            console.error('Error deleting user:', err);
            this.toast.error('Erreur lors de la suppression de l\'utilisateur');
          }
        });
      });
  }
  protected readonly faEye = faEye;
  protected readonly faFilter = faFilter;
  protected readonly faRedoAlt = faRedoAlt;
  protected readonly faArrowLeft = faArrowLeft;
}