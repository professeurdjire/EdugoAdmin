import { Component, OnInit } from '@angular/core';
import {CommonModule} from '@angular/common';
import {FaIconComponent} from '@fortawesome/angular-fontawesome';
import {FormsModule} from '@angular/forms';
import { NiveauxService } from '../../../services/api/admin/niveaux.service';
import { ClassesService } from '../../../services/api/admin/classes.service';
import { MatieresService } from '../../../services/api/admin/matieres.service';
import { Niveau } from '../../../api/model/niveau';
import { Classe } from '../../../api/model/classe';
import { Matiere } from '../../../api/model/matiere';
import { AuthService } from '../../../services/api/auth.service';

interface SubjectDisplay {
  id: number;
  name: string;
  description: string;
  quizCount: number;
  studentsCount: number;
}

interface LevelDisplay {
  id: number;
  name: string;
  cycle: string;
  classesCount: number;
  studentsCount: number;
}

interface ClassDisplay {
  id: number;
  name: string;
  level: string;
  teacher: string;
  studentsCount: number;
}

@Component({
  selector: 'app-contenus',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contenus.html',
  styleUrls: [ './contenus.css'],
})
export class Contenus implements OnInit {
  currentTab: 'subjects' | 'levels' | 'classes' = 'subjects';
  isModalOpen = false;
  editingId: number | null = null;
  modalTitle = '';
  loading: boolean = false;
  error: string | null = null;

  // Données d'exemple
  subjects: SubjectDisplay[] = [];
  levels: LevelDisplay[] = [];
  classes: ClassDisplay[] = [];

  // Données du formulaire
  formData = {
    name: '',
    description: '',
    cycle: 'college',
    level: '6ème',
    teacher: ''
  };

  constructor(
    private niveauxService: NiveauxService,
    private classesService: ClassesService,
    private matieresService: MatieresService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    // Check if user is authenticated
    if (!this.authService.isLoggedIn()) {
      this.error = "Vous devez vous connecter pour accéder à cette page.";
      return;
    }
    
    this.loadSubjects();
    this.loadLevels();
    this.loadClasses();
  }

  loadSubjects() {
    this.loading = true;
    this.matieresService.list().subscribe({
      next: (matieres: Matiere[]) => {
        this.subjects = matieres.map(matiere => ({
          id: matiere.id || 0,
          name: matiere.nom || '',
          description: '', // Not in API model
          quizCount: 0, // Not in API model
          studentsCount: 0 // Not in API model
        }));
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading subjects:', err);
        this.handleError(err, 'matières');
        this.loading = false;
      }
    });
  }

  loadLevels() {
    this.loading = true;
    this.niveauxService.list().subscribe({
      next: (niveaux: Niveau[]) => {
        this.levels = niveaux.map(niveau => ({
          id: niveau.id || 0,
          name: niveau.nom || '',
          cycle: 'college', // Default value
          classesCount: niveau.classes?.length || 0,
          studentsCount: 0 // Not in API model
        }));
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading levels:', err);
        this.handleError(err, 'niveaux');
        this.loading = false;
      }
    });
  }

  loadClasses() {
    this.loading = true;
    this.classesService.list().subscribe({
      next: (classes: Classe[]) => {
        this.classes = classes.map(classe => ({
          id: classe.id || 0,
          name: classe.nom || '',
          level: classe.niveau?.nom || '',
          teacher: '', // Not in API model
          studentsCount: classe.eleves?.length || 0
        }));
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading classes:', err);
        this.handleError(err, 'classes');
        this.loading = false;
      }
    });
  }

  handleError(err: any, entityType: string) {
    if (err.status === 401 || err.status === 403) {
      this.error = "Vous n'êtes pas autorisé à accéder à cette ressource. Veuillez vous connecter avec les bonnes permissions.";
    } else if (err.status === 0) {
      this.error = `Impossible de se connecter au serveur pour charger les ${entityType}. Veuillez vérifier que le backend est en cours d'exécution.`;
    } else {
      this.error = `Erreur lors du chargement des ${entityType}: ${err.message || 'Erreur inconnue'}`;
    }
  }

  switchTab(tab: 'subjects' | 'levels' | 'classes') {
    this.currentTab = tab;
  }

  openAddModal() {
    this.isModalOpen = true;
    this.editingId = null;
    this.resetForm();

    switch(this.currentTab) {
      case 'subjects':
        this.modalTitle = 'Ajouter une matière';
        break;
      case 'levels':
        this.modalTitle = 'Ajouter un niveau';
        break;
      case 'classes':
        this.modalTitle = 'Ajouter une classe';
        break;
    }
  }

  openEditModal(id: number) {
    this.isModalOpen = true;
    this.editingId = id;

    switch(this.currentTab) {
      case 'subjects':
        const subject = this.subjects.find(s => s.id === id);
        if (subject) {
          this.modalTitle = 'Modifier la matière';
          this.formData.name = subject.name;
          this.formData.description = subject.description;
        }
        break;
      case 'levels':
        const level = this.levels.find(l => l.id === id);
        if (level) {
          this.modalTitle = 'Modifier le niveau';
          this.formData.name = level.name;
          this.formData.cycle = level.cycle;
        }
        break;
      case 'classes':
        const classItem = this.classes.find(c => c.id === id);
        if (classItem) {
          this.modalTitle = 'Modifier la classe';
          this.formData.name = classItem.name;
          this.formData.level = classItem.level;
          this.formData.teacher = classItem.teacher;
        }
        break;
    }
  }

  closeModal() {
    this.isModalOpen = false;
    this.resetForm();
  }

  resetForm() {
    this.formData = {
      name: '',
      description: '',
      cycle: 'college',
      level: '6ème',
      teacher: ''
    };
  }

  saveContent() {
    if (!this.formData.name.trim()) {
      alert('Veuillez remplir le nom');
      return;
    }

    switch(this.currentTab) {
      case 'subjects':
        if (this.editingId) {
          // Modification
          this.matieresService.update(this.editingId, { nom: this.formData.name }).subscribe({
            next: (updatedMatiere: Matiere) => {
              // Update local data
              const index = this.subjects.findIndex(s => s.id === this.editingId);
              if (index !== -1) {
                this.subjects[index] = {
                  ...this.subjects[index],
                  name: updatedMatiere.nom || ''
                };
              }
              this.closeModal();
            },
            error: (err) => {
              console.error('Error updating subject:', err);
              alert('Erreur lors de la mise à jour de la matière');
            }
          });
        } else {
          // Ajout
          this.matieresService.create({ nom: this.formData.name }).subscribe({
            next: (newMatiere: Matiere) => {
              this.subjects.push({
                id: newMatiere.id || 0,
                name: newMatiere.nom || '',
                description: '',
                quizCount: 0,
                studentsCount: 0
              });
              this.closeModal();
            },
            error: (err) => {
              console.error('Error creating subject:', err);
              alert('Erreur lors de la création de la matière');
            }
          });
        }
        break;

      case 'levels':
        if (this.editingId) {
          // Modification
          this.niveauxService.update(this.editingId, { nom: this.formData.name }).subscribe({
            next: (updatedNiveau: Niveau) => {
              // Update local data
              const index = this.levels.findIndex(l => l.id === this.editingId);
              if (index !== -1) {
                this.levels[index] = {
                  ...this.levels[index],
                  name: updatedNiveau.nom || ''
                };
              }
              this.closeModal();
            },
            error: (err) => {
              console.error('Error updating level:', err);
              alert('Erreur lors de la mise à jour du niveau');
            }
          });
        } else {
          // Ajout
          this.niveauxService.create({ nom: this.formData.name }).subscribe({
            next: (newNiveau: Niveau) => {
              this.levels.push({
                id: newNiveau.id || 0,
                name: newNiveau.nom || '',
                cycle: this.formData.cycle,
                classesCount: 0,
                studentsCount: 0
              });
              this.closeModal();
            },
            error: (err) => {
              console.error('Error creating level:', err);
              alert('Erreur lors de la création du niveau');
            }
          });
        }
        break;

      case 'classes':
        if (this.editingId) {
          // Modification
          // For classes, we need to find the niveau by name
          const niveau = this.levels.find(l => l.name === this.formData.level);
          this.classesService.update(this.editingId, { 
            nom: this.formData.name,
            niveau: niveau ? { id: niveau.id } : undefined
          }).subscribe({
            next: (updatedClasse: Classe) => {
              // Update local data
              const index = this.classes.findIndex(c => c.id === this.editingId);
              if (index !== -1) {
                this.classes[index] = {
                  ...this.classes[index],
                  name: updatedClasse.nom || '',
                  level: updatedClasse.niveau?.nom || ''
                };
              }
              this.closeModal();
            },
            error: (err) => {
              console.error('Error updating class:', err);
              alert('Erreur lors de la mise à jour de la classe');
            }
          });
        } else {
          // Ajout
          // For classes, we need to find the niveau by name
          const niveau = this.levels.find(l => l.name === this.formData.level);
          this.classesService.create({ 
            nom: this.formData.name,
            niveau: niveau ? { id: niveau.id } : undefined
          }).subscribe({
            next: (newClasse: Classe) => {
              this.classes.push({
                id: newClasse.id || 0,
                name: newClasse.nom || '',
                level: newClasse.niveau?.nom || this.formData.level,
                teacher: this.formData.teacher,
                studentsCount: 0
              });
              this.closeModal();
            },
            error: (err) => {
              console.error('Error creating class:', err);
              alert('Erreur lors de la création de la classe');
            }
          });
        }
        break;
    }
  }

  deleteItem(id: number) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet élément ?')) {
      switch(this.currentTab) {
        case 'subjects':
          this.matieresService.delete(id).subscribe({
            next: () => {
              this.subjects = this.subjects.filter(s => s.id !== id);
            },
            error: (err) => {
              console.error('Error deleting subject:', err);
              alert('Erreur lors de la suppression de la matière');
            }
          });
          break;
        case 'levels':
          this.niveauxService.delete(id).subscribe({
            next: () => {
              this.levels = this.levels.filter(l => l.id !== id);
            },
            error: (err) => {
              console.error('Error deleting level:', err);
              alert('Erreur lors de la suppression du niveau');
            }
          });
          break;
        case 'classes':
          this.classesService.delete(id).subscribe({
            next: () => {
              this.classes = this.classes.filter(c => c.id !== id);
            },
            error: (err) => {
              console.error('Error deleting class:', err);
              alert('Erreur lors de la suppression de la classe');
            }
          });
          break;
      }
    }
  }

  get showSubjectFields(): boolean {
    return this.currentTab === 'subjects';
  }

  get showLevelFields(): boolean {
    return this.currentTab === 'levels';
  }

  get showClassFields(): boolean {
    return this.currentTab === 'classes';
  }
}