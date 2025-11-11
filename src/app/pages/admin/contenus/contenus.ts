import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NiveauxService } from '../../../services/api/admin/niveaux.service';
import { ClassesService } from '../../../services/api/admin/classes.service';
import { MatieresService } from '../../../services/api/admin/matieres.service';
import { Niveau } from '../../../api/model/niveau';
import { Classe } from '../../../api/model/classe';
import { Matiere } from '../../../api/model/matiere';

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
  styleUrls: ['./contenus.css'],
})
export class Contenus implements OnInit {
  currentTab: 'subjects' | 'levels' | 'classes' = 'subjects';
  isModalOpen = false;
  editingId: number | null = null;
  modalTitle = '';
  loading: boolean = false;
  error: string | null = null;

  // Données
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
    private matieresService: MatieresService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading = true;
    this.error = null;
    
    // Load all data in parallel
    this.loadSubjects();
    this.loadLevels();
    this.loadClasses();
  }

  loadSubjects() {
    this.matieresService.list().subscribe({
      next: (matieres: any[]) => {
        console.log('Matieres loaded:', matieres);
        this.subjects = matieres.map(matiere => ({
          id: matiere.id || 0,
          name: matiere.nom || 'Sans nom',
          description: 'Description non disponible',
          quizCount: 0,
          studentsCount: 0
        }));
        console.log('Mapped subjects:', this.subjects);
        
        // Check if all data is loaded
        this.checkIfLoadingComplete();
      },
      error: (err) => {
        console.error('Error loading subjects:', err);
        this.handleError(err, 'matières');
      }
    });
  }

  loadLevels() {
    this.niveauxService.list().subscribe({
      next: (niveaux: any[]) => {
        console.log('Niveaux loaded:', niveaux);
        this.levels = niveaux.map(niveau => ({
          id: niveau.id || 0,
          name: niveau.nom || 'Sans nom',
          cycle: this.determineCycle(niveau.nom || ''),
          classesCount: 0,
          studentsCount: 0
        }));
        console.log('Mapped levels:', this.levels);
        
        // Set default level for form if needed
        if (this.levels.length > 0 && !this.formData.level) {
          this.formData.level = this.levels[0].name;
        }
        
        // Check if all data is loaded
        this.checkIfLoadingComplete();
      },
      error: (err) => {
        console.error('Error loading levels:', err);
        this.handleError(err, 'niveaux');
      }
    });
  }

  loadClasses() {
    this.classesService.list().subscribe({
      next: (classes: any[]) => {
        console.log('Classes loaded:', classes);
        this.classes = classes.map(classe => ({
          id: classe.id || 0,
          name: classe.nom || 'Sans nom',
          level: classe.niveauNom || 'Non assigné',
          studentsCount: 0,
          teacher: 'Non assigné'
        }));
        console.log('Mapped classes:', this.classes);
        
        // Check if all data is loaded
        this.checkIfLoadingComplete();
      },
      error: (err) => {
        console.error('Error loading classes:', err);
        this.handleError(err, 'classes');
      }
    });
  }

  checkIfLoadingComplete() {
    // Since we're loading in parallel, we need to check if all requests have completed
    // We'll set loading to false after a short delay to ensure all requests are processed
    setTimeout(() => {
      this.loading = false;
      console.log('Data loading complete. Subjects:', this.subjects.length, 'Levels:', this.levels.length, 'Classes:', this.classes.length);
    }, 500);
  }

  // Méthode utilitaire pour déterminer le cycle basé sur le nom du niveau
  private determineCycle(niveauNom: string): string {
    const collegeLevels = ['6ème', '5ème', '4ème', '3ème'];
    const lyceeLevels = ['2nde', '1ère', 'Terminale'];
    
    if (collegeLevels.some(level => niveauNom.includes(level))) {
      return 'college';
    } else if (lyceeLevels.some(level => niveauNom.includes(level))) {
      return 'lycee';
    }
    return 'college'; // valeur par défaut
  }

  handleError(err: any, entityType: string) {
    if (err.status === 401 || err.status === 403) {
      this.error = "Vous n'êtes pas autorisé à accéder à cette ressource.";
    } else if (err.status === 0) {
      this.error = `Impossible de se connecter au serveur pour charger les ${entityType}.`;
    } else {
      this.error = `Erreur lors du chargement des ${entityType}: ${err.message || 'Erreur inconnue'}`;
    }
    this.loading = false;
  }

  switchTab(tab: 'subjects' | 'levels' | 'classes') {
    this.currentTab = tab;
    // Force change detection
    setTimeout(() => {
      console.log('Switched to tab:', tab, 'Data count:', 
        tab === 'subjects' ? this.subjects.length : 
        tab === 'levels' ? this.levels.length : 
        this.classes.length);
    }, 100);
  }

  refreshData() {
    console.log('Refreshing data...');
    this.loadData();
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
      level: this.levels.length > 0 ? this.levels[0].name : '6ème',
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
            next: (updatedMatiere: any) => {
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
            next: (newMatiere: any) => {
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
            next: (updatedNiveau: any) => {
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
            next: (newNiveau: any) => {
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
            next: (updatedClasse: any) => {
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
            next: (newClasse: any) => {
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