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
import { StatistiquesMatiereResponse } from '../../../api/model/statistiquesMatiereResponse';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { ConfirmService } from '../../../shared/ui/confirm/confirm.service';
import { ExercicesService } from '../../../services/api/admin/exercices.service';
import { Exercice } from '../../../api/model/exercice';
import { AdminEleveService, EleveProfile } from '../../../services/api/admin/admin-eleve.service';
import { forkJoin } from 'rxjs';

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
  statsParMatiere: StatistiquesMatiereResponse[] = [];
  
  // Données pour calculer les statistiques
  allExercices: Exercice[] = [];
  allEleves: EleveProfile[] = [];

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
    private exercicesService: ExercicesService,
    private adminEleveService: AdminEleveService,
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

    // Charger toutes les données nécessaires pour calculer les statistiques
    forkJoin({
      matieres: this.matieresService.list(),
      niveaux: this.niveauxService.list(),
      classes: this.classesService.list(),
      exercices: this.exercicesService.list(),
      eleves: this.adminEleveService.listEleves(),
      stats: this.statistiquesService.getStatistiquesPlateforme()
    }).subscribe({
      next: (data) => {
        // Stocker les données pour les calculs
        this.allExercices = Array.isArray(data.exercices) ? data.exercices : [];
        this.allEleves = Array.isArray(data.eleves) ? data.eleves.filter(e => e.role === 'ELEVE') : [];
        
        // Charger les statistiques globales
        this.statsParNiveau = data.stats?.statistiquesParNiveau || [];
        this.statsParClasse = data.stats?.statistiquesParClasse || [];
        this.statsParMatiere = (data.stats as any)?.statistiquesParMatiere || [];
        
        // Calculer les statistiques réelles
        this.calculateRealStatistics(data.classes);
        
        // Charger les données de base avec les statistiques calculées
        this.loadSubjects(data.matieres);
        this.loadLevels(data.niveaux, data.classes);
        this.loadClasses(data.classes);
        
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement données contenus:', err);
        this.handleError(err, 'données');
        this.loading = false;
      }
    });
  }
  
  private calculateRealStatistics(classes: Classe[]): void {
    // Calculer les statistiques par matière
    const matiereStatsMap = new Map<number, { 
      exercices: number; 
      eleves: Set<number>;
      niveaux: Set<number>;
    }>();
    
    // Parcourir tous les exercices pour compter par matière
    this.allExercices.forEach(exercice => {
      const matiereId = exercice.matiere?.id || (exercice as any).matiereId;
      const niveauId = exercice.niveauScolaire?.id || (exercice as any).niveauScolaireId;
      
      if (matiereId) {
        if (!matiereStatsMap.has(matiereId)) {
          matiereStatsMap.set(matiereId, { exercices: 0, eleves: new Set(), niveaux: new Set() });
        }
        const stats = matiereStatsMap.get(matiereId)!;
        stats.exercices++;
        if (niveauId) {
          stats.niveaux.add(niveauId);
        }
      }
    });
    
    // Compter les élèves par matière (élèves dans les niveaux qui ont des exercices de cette matière)
    matiereStatsMap.forEach((stats, matiereId) => {
      // Pour chaque niveau qui a des exercices de cette matière, ajouter tous les élèves de ce niveau
      stats.niveaux.forEach(niveauId => {
        const elevesInNiveau = this.allEleves.filter(e => e.niveauId === niveauId);
        elevesInNiveau.forEach(eleve => {
          stats.eleves.add(eleve.id);
        });
      });
    });
    
    // Convertir en format StatistiquesMatiereResponse
    this.statsParMatiere = Array.from(matiereStatsMap.entries()).map(([matiereId, stats]) => ({
      matiereId: matiereId,
      nombreExercices: stats.exercices,
      nombreEleves: stats.eleves.size,
      nombreExercicesActifs: stats.exercices // Pour l'instant, considérer tous comme actifs
    }));
    
    // Calculer les statistiques par niveau
    const niveauStatsMap = new Map<number, { classes: Set<number>; eleves: Set<number> }>();
    
    // Compter les classes par niveau depuis les classes
    const allClasses = Array.isArray(classes) ? classes : [];
    allClasses.forEach(classe => {
      const niveauId = classe.niveau?.id || (classe as any).niveauId;
      const classeId = classe.id;
      
      if (niveauId && classeId) {
        if (!niveauStatsMap.has(niveauId)) {
          niveauStatsMap.set(niveauId, { classes: new Set(), eleves: new Set() });
        }
        niveauStatsMap.get(niveauId)!.classes.add(classeId);
      }
    });
    
    // Compter les élèves par niveau
    this.allEleves.forEach(eleve => {
      const niveauId = eleve.niveauId;
      
      if (niveauId) {
        if (!niveauStatsMap.has(niveauId)) {
          niveauStatsMap.set(niveauId, { classes: new Set(), eleves: new Set() });
        }
        niveauStatsMap.get(niveauId)!.eleves.add(eleve.id);
      }
    });
    
    // Mettre à jour ou créer les statistiques par niveau
    niveauStatsMap.forEach((stats, niveauId) => {
      const existingStat = this.statsParNiveau.find(s => s.niveauId === niveauId);
      if (existingStat) {
        existingStat.nombreClasses = stats.classes.size;
        existingStat.nombreEleves = stats.eleves.size;
      } else {
        this.statsParNiveau.push({
          niveauId: niveauId,
          nombreClasses: stats.classes.size,
          nombreEleves: stats.eleves.size
        });
      }
    });
    
    // Calculer les statistiques par classe
    const classeStatsMap = new Map<number, Set<number>>();
    
    this.allEleves.forEach(eleve => {
      const classeId = eleve.classeId;
      if (classeId) {
        if (!classeStatsMap.has(classeId)) {
          classeStatsMap.set(classeId, new Set());
        }
        classeStatsMap.get(classeId)!.add(eleve.id);
      }
    });
    
    // Mettre à jour ou créer les statistiques par classe
    classeStatsMap.forEach((eleves, classeId) => {
      const existingStat = this.statsParClasse.find(s => s.classeId === classeId);
      if (existingStat) {
        existingStat.nombreEleves = eleves.size;
      } else {
        this.statsParClasse.push({
          classeId: classeId,
          nombreEleves: eleves.size
        });
      }
    });
  }

  private loadSubjects(matieres: Matiere[]) {
    this.subjects = matieres.map(matiere => {
      const matiereId = matiere.id || 0;
      // Compter les exercices/challenges pour cette matière
      const exercicesCount = this.allExercices.filter(e => {
        const exMatiereId = e.matiere?.id || (e as any).matiereId;
        return exMatiereId === matiereId;
      }).length;
      
      // Compter les élèves qui ont fait des exercices de cette matière
      // Pour l'instant, on peut utiliser les stats ou compter les élèves ayant cette matière dans leur niveau/classe
      const stats = this.statsParMatiere.find(s => s.matiereId === matiereId);
      
      return {
        id: matiereId,
        name: matiere.nom || 'Sans nom',
        description: this.getSubjectDescription(matiere, exercicesCount),
        quizCount: exercicesCount,
        studentsCount: stats?.nombreEleves || this.calculateStudentsCountForSubject(matiere)
      };
    });
  }

  private loadLevels(niveaux: Niveau[], classes: Classe[]) {
    this.levels = niveaux.map(niveau => {
      const baseId = niveau.id || 0;
      const stats = this.statsParNiveau.find(s => s.niveauId === baseId);
      
      // Compter les classes pour ce niveau
      const classesForNiveau = classes.filter(c => c.niveau?.id === baseId || (c as any).niveauId === baseId);
      
      // Compter les élèves pour ce niveau
      const elevesForNiveau = this.allEleves.filter(e => e.niveauId === baseId);
      
      return {
        id: baseId,
        name: niveau.nom || 'Sans nom',
        cycle: this.determineCycle(niveau.nom || ''),
        classesCount: stats?.nombreClasses ?? classesForNiveau.length,
        studentsCount: stats?.nombreEleves ?? elevesForNiveau.length
      } as LevelDisplay;
    });
    
    // Mettre à jour le niveau par défaut dans le formulaire
    if (this.levels.length > 0) {
      this.formData.level = this.levels[0].name;
    }
  }

  private loadClasses(classes: Classe[]) {
    this.classes = classes.map(classe => {
      const baseId = classe.id || 0;
      const stats = this.statsParClasse.find(s => s.classeId === baseId);
      
      // Compter les élèves pour cette classe
      const elevesForClasse = this.allEleves.filter(e => e.classeId === baseId);
      
      return {
        id: baseId,
        name: classe.nom || 'Sans nom',
        level: classe.niveau?.nom || 'Non assigné',
        studentsCount: stats?.nombreEleves ?? elevesForClasse.length
      } as ClassDisplay;
    });
  }

  // Méthodes utilitaires pour le mapping des données
  private getSubjectDescription(matiere: Matiere, exercicesCount?: number): string {
    const count = exercicesCount !== undefined ? exercicesCount : (matiere.exercice?.length || 0);
    return `Matière avec ${count} exercices`;
  }

  private calculateStudentsCountForSubject(matiere: Matiere): number {
    const stats = this.statsParMatiere?.find(s => s.matiereId === matiere.id);
    if (stats?.nombreEleves) {
      return stats.nombreEleves;
    }
    
    // Si pas de stats, essayer de compter les élèves qui ont fait des exercices de cette matière
    // Pour l'instant, retourner 0 si aucune donnée
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

  // Gestion du chargement - plus nécessaire avec forkJoin
  private loadedCount = 0;
  private readonly totalRequests = 1; // Maintenant tout est chargé en une fois avec forkJoin

  private checkLoadingComplete() {
    this.loadedCount++;
    if (this.loadedCount === this.totalRequests) {
      this.loading = false;
      this.loadedCount = 0;
      console.log('Chargement complet:', {
        subjects: this.subjects.length,
        levels: this.levels.length,
        classes: this.classes.length,
        exercices: this.allExercices.length,
        eleves: this.allEleves.length
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

    // Uniquement marquer la requête comme terminée via checkLoadingComplete
    // pour éviter de doubler l'incrément de loadedCount.
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