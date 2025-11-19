import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NiveauxService } from '../../../services/api/admin/niveaux.service';
import { ClassesService } from '../../../services/api/admin/classes.service';
import { MatieresService } from '../../../services/api/admin/matieres.service';
import { Niveau } from '../../../api/model/niveau';
import { Classe } from '../../../api/model/classe';
import { Matiere } from '../../../api/model/matiere';
import { StatistiquesService } from '../../../api/api/statistiques.service';
import { StatistiquesNiveauResponse } from '../../../api/model/statistiquesNiveauResponse';
import { StatistiquesClasseResponse } from '../../../api/model/statistiquesClasseResponse';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { ConfirmService } from '../../../shared/ui/confirm/confirm.service';

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

  // Statistiques globales par niveau et par classe
  statsParNiveau: StatistiquesNiveauResponse[] = [];
  statsParClasse: StatistiquesClasseResponse[] = [];

  // Données du formulaire
  formData = {
    name: '',
    description: '',
    cycle: 'college',
    level: '',
  };

  constructor(
    private niveauxService: NiveauxService,
    private classesService: ClassesService,
    private matieresService: MatieresService,
    private statistiquesService: StatistiquesService,
    private toast: ToastService,
    private confirm: ConfirmService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading = true;
    this.error = null;
    this.loadedCount = 0;

    // Charger les statistiques globales (par niveau / par classe)
    this.loadGlobalStats();

    // Charger les données de base
    this.loadSubjects();
    this.loadLevels();
    this.loadClasses();
  }

  private loadGlobalStats() {
    this.statistiquesService.getStatistiquesPlateforme().subscribe({
      next: (stats) => {
        this.statsParNiveau = stats.statistiquesParNiveau || [];
        this.statsParClasse = stats.statistiquesParClasse || [];
        this.checkLoadingComplete();
      },
      error: (err) => {
        console.error('Erreur chargement statistiques contenus:', err);
        this.handleError(err, 'statistiques');
      }
    });
  }

  loadSubjects() {
    this.matieresService.list().subscribe({
      next: (matieres: Matiere[]) => {
        console.log('Matières chargées:', matieres);
        this.subjects = matieres.map(matiere => ({
          id: matiere.id || 0,
          name: matiere.nom || 'Sans nom',
          description: this.getSubjectDescription(matiere),
          quizCount: matiere.exercice?.length || 0,
          studentsCount: this.calculateStudentsCountForSubject(matiere)
        }));
        this.checkLoadingComplete();
      },
      error: (err) => {
        console.error('Erreur chargement matières:', err);
        this.handleError(err, 'matières');
      }
    });
  }

  loadLevels() {
    this.niveauxService.list().subscribe({
      next: (niveaux: Niveau[]) => {
        console.log('Niveaux chargés:', niveaux);
        this.levels = niveaux.map(niveau => {
          const baseId = niveau.id || 0;
          const stats = this.statsParNiveau.find(s => s.niveauId === baseId);
          return {
            id: baseId,
            name: niveau.nom || 'Sans nom',
            cycle: this.determineCycle(niveau.nom || ''),
            classesCount: stats?.nombreClasses ?? ((niveau as any).classes?.length || 0),
            studentsCount: stats?.nombreEleves ?? 0
          } as LevelDisplay;
        });
        
        // Mettre à jour le niveau par défaut dans le formulaire
        if (this.levels.length > 0) {
          this.formData.level = this.levels[0].name;
        }
        
        this.checkLoadingComplete();
      },
      error: (err) => {
        console.error('Erreur chargement niveaux:', err);
        this.handleError(err, 'niveaux');
      }
    });
  }

  loadClasses() {
    this.classesService.list().subscribe({
      next: (classes: Classe[]) => {
        console.log('Classes chargées:', classes);
        this.classes = classes.map(classe => {
          const baseId = classe.id || 0;
          const stats = this.statsParClasse.find(s => s.classeId === baseId);
          return {
            id: baseId,
            name: classe.nom || 'Sans nom',
            level: classe.niveau?.nom || 'Non assigné',
            studentsCount: stats?.nombreEleves ?? ((classe as any).eleves?.length || 0)
          } as ClassDisplay;
        });
        this.checkLoadingComplete();
      },
      error: (err) => {
        console.error('Erreur chargement classes:', err);
        this.handleError(err, 'classes');
      }
    });
  }

  // Méthodes utilitaires pour le mapping des données
  private getSubjectDescription(matiere: Matiere): string {
    return `Matière avec ${matiere.exercice?.length || 0} exercices`;
  }

  private calculateStudentsCountForSubject(matiere: Matiere): number {
    // En attente de statistiques dédiées par matière côté backend
    return 0;
  }

  // Méthode pour déterminer le cycle basé sur le nom du niveau
  private determineCycle(niveauNom: string): string {
    const primaireLevels = ['CP', 'CE1', 'CE2', 'CM1', 'CM2'];
    const collegeLevels = ['6ème', '5ème', '4ème', '3ème'];
    const lyceeLevels = ['Seconde', 'Première', 'Terminale', '2nde', '1ère'];
    
    niveauNom = niveauNom.toLowerCase();
    
    if (primaireLevels.some(level => niveauNom.includes(level.toLowerCase()))) {
      return 'primaire';
    } else if (collegeLevels.some(level => niveauNom.includes(level.toLowerCase()))) {
      return 'college';
    } else if (lyceeLevels.some(level => niveauNom.includes(level.toLowerCase()))) {
      return 'lycee';
    }
    return 'college'; // valeur par défaut
  }

  // Gestion du chargement
  private loadedCount = 0;
  private readonly totalRequests = 4;

  private checkLoadingComplete() {
    this.loadedCount++;
    if (this.loadedCount === this.totalRequests) {
      this.loading = false;
      this.loadedCount = 0; // Reset pour les prochains chargements
      console.log('Chargement complet:', {
        subjects: this.subjects.length,
        levels: this.levels.length,
        classes: this.classes.length
      });
    }
  }

  handleError(err: any, entityType: string) {
    console.error(`Erreur ${entityType}:`, err);
    
    if (err.status === 401 || err.status === 403) {
      this.error = "Vous n'êtes pas autorisé à accéder à cette ressource.";
    } else if (err.status === 0) {
      this.error = `Impossible de se connecter au serveur pour charger les ${entityType}.`;
    } else {
      this.error = `Erreur lors du chargement des ${entityType}.`;
    }
    
    this.loadedCount++;
    this.checkLoadingComplete();
  }

  // Méthodes d'interface utilisateur
  switchTab(tab: 'subjects' | 'levels' | 'classes') {
    this.currentTab = tab;
  }

  refreshData() {
    console.log('Actualisation des données...');
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
      level: this.levels.length > 0 ? this.levels[0].name : '',
    };
  }

  saveContent() {
    if (!this.formData.name.trim()) {
      this.toast.warning('Veuillez remplir le nom');
      return;
    }

    switch(this.currentTab) {
      case 'subjects':
        this.saveSubject();
        break;
      case 'levels':
        this.saveLevel();
        break;
      case 'classes':
        this.saveClass();
        break;
    }
  }

  private saveSubject() {
    const payload = { nom: this.formData.name.trim() };

    if (this.editingId) {
      // Modification
      this.matieresService.update(this.editingId, payload).subscribe({
        next: (updatedMatiere: Matiere) => {
          // Mettre à jour les données locales
          const index = this.subjects.findIndex(s => s.id === this.editingId);
          if (index !== -1) {
            this.subjects[index] = {
              ...this.subjects[index],
              name: updatedMatiere.nom || '',
              description: this.getSubjectDescription(updatedMatiere)
            };
          }
          this.closeModal();
          this.toast.success('Matière mise à jour avec succès');
        },
        error: (err) => {
          console.error('Erreur modification matière:', err);
          this.toast.error('Erreur lors de la mise à jour de la matière');
        }
      });
    } else {
      // Ajout
      this.matieresService.create(payload).subscribe({
        next: (newMatiere: Matiere) => {
          this.subjects.push({
            id: newMatiere.id || Date.now(),
            name: newMatiere.nom || '',
            description: this.getSubjectDescription(newMatiere),
            quizCount: 0,
            studentsCount: 0
          });
          this.closeModal();
          this.toast.success('Matière créée avec succès');
        },
        error: (err) => {
          console.error('Erreur création matière:', err);
          this.toast.error('Erreur lors de la création de la matière');
        }
      });
    }
  }

  private saveLevel() {
    const payload = { nom: this.formData.name.trim() };

    if (this.editingId) {
      // Modification
      this.niveauxService.update(this.editingId, payload).subscribe({
        next: (updatedNiveau: Niveau) => {
          // Mettre à jour les données locales
          const index = this.levels.findIndex(l => l.id === this.editingId);
          if (index !== -1) {
            this.levels[index] = {
              ...this.levels[index],
              name: updatedNiveau.nom || '',
              cycle: this.determineCycle(updatedNiveau.nom || '')
            };
          }
          this.closeModal();
          this.toast.success('Niveau mis à jour avec succès');
        },
        error: (err) => {
          console.error('Erreur modification niveau:', err);
          this.toast.error('Erreur lors de la mise à jour du niveau');
        }
      });
    } else {
      // Ajout
      this.niveauxService.create(payload).subscribe({
        next: (newNiveau: Niveau) => {
          this.levels.push({
            id: newNiveau.id || Date.now(),
            name: newNiveau.nom || '',
            cycle: this.formData.cycle,
            classesCount: 0,
            studentsCount: 0
          });
          this.closeModal();
          this.toast.success('Niveau créé avec succès');
        },
        error: (err) => {
          console.error('Erreur création niveau:', err);
          this.toast.error('Erreur lors de la création du niveau');
        }
      });
    }
  }

  private saveClass() {
    // Trouver le niveau correspondant
    const niveau = this.levels.find(l => l.name === this.formData.level);

    const payload = { 
      nom: this.formData.name.trim(),
      // Utiliser l'ID du niveau pour correspondre à ClasseRequest.niveauId côté backend
      niveauId: niveau?.id
    };

    if (this.editingId) {
      // Modification
      this.classesService.update(this.editingId, payload).subscribe({
        next: (updatedClasse: Classe) => {
          // Mettre à jour les données locales
          const index = this.classes.findIndex(c => c.id === this.editingId);
          if (index !== -1) {
            this.classes[index] = {
              ...this.classes[index],
              name: updatedClasse.nom || '',
              level: updatedClasse.niveau?.nom || this.formData.level,
            };
          }
          this.closeModal();
          this.toast.success('Classe mise à jour avec succès');
        },
        error: (err) => {
          console.error('Erreur modification classe:', err);
          this.toast.error('Erreur lors de la mise à jour de la classe');
        }
      });
    } else {
      // Ajout
      this.classesService.create(payload).subscribe({
        next: (newClasse: Classe) => {
          this.classes.push({
            id: newClasse.id || Date.now(),
            name: newClasse.nom || '',
            level: newClasse.niveau?.nom || this.formData.level,
            studentsCount: 0
          });
          this.closeModal();
          this.toast.success('Classe créée avec succès');
        },
        error: (err) => {
          console.error('Erreur création classe:', err);
          this.toast.error('Erreur lors de la création de la classe');
        }
      });
    }
  }

  deleteItem(id: number) {
    this.confirm
      .confirm({
        title: 'Supprimer',
        message: 'Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est irréversible.',
        confirmText: 'Supprimer',
        cancelText: 'Annuler'
      })
      .then((ok) => {
        if (!ok) return;
        switch(this.currentTab) {
          case 'subjects':
            this.matieresService.delete(id).subscribe({
              next: () => {
                this.subjects = this.subjects.filter(s => s.id !== id);
                this.toast.success('Matière supprimée avec succès');
              },
              error: (err) => {
                console.error('Erreur suppression matière:', err);
                this.toast.error('Erreur lors de la suppression de la matière');
              }
            });
            break;
          case 'levels':
            this.niveauxService.delete(id).subscribe({
              next: () => {
                this.levels = this.levels.filter(l => l.id !== id);
                this.toast.success('Niveau supprimé avec succès');
              },
              error: (err) => {
                console.error('Erreur suppression niveau:', err);
                this.toast.error('Erreur lors de la suppression du niveau');
              }
            });
            break;
          case 'classes':
            this.classesService.delete(id).subscribe({
              next: () => {
                this.classes = this.classes.filter(c => c.id !== id);
                this.toast.success('Classe supprimée avec succès');
              },
              error: (err) => {
                console.error('Erreur suppression classe:', err);
                this.toast.error('Erreur lors de la suppression de la classe');
              }
            });
            break;
        }
      });
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