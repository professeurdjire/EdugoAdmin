import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import {FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { ExercicesService as AdminExercicesService } from '../../../../services/api/admin/exercices.service';
import { Exercice } from '../../../../api/model/exercice';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import { ConfirmService } from '../../../../shared/ui/confirm/confirm.service';
import { QuestionsService, CreateQuestionRequest } from '../../../../services/api/questions.service';
import { forkJoin } from 'rxjs';
import { MatieresService } from '../../../../services/api/admin/matieres.service';
import { Matiere } from '../../../../api/model/matiere';
import { NiveauxService } from '../../../../services/api/admin/niveaux.service';
import { Niveau } from '../../../../api/model/niveau';

@Component({
  selector: 'app-exercice-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule
  ],
  templateUrl: './exercice-form.html',
  styleUrls: ['./exercice-form.css']
})
export class ExerciceForm implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef;
  @ViewChild('imageInput') imageInput!: ElementRef;

  exerciceForm: FormGroup;
  isLoading = false;
  loadingTypes = false;
  backendTypes: Array<{ id: number; libelle: string }> = [];
  matieres: Matiere[] = [];
  niveaux: Niveau[] = [];
  isEditMode = false;
  exerciceId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private exercicesService: AdminExercicesService,
    private toast: ToastService,
    private confirm: ConfirmService,
    private questionsService: QuestionsService,
    private matieresService: MatieresService,
    private niveauxService: NiveauxService
  ) {
    this.exerciceForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadingTypes = true;
    this.questionsService.getTypes().subscribe({
      next: (types) => {
        this.backendTypes = types || [];
        this.loadingTypes = false;
      },
      error: () => {
        this.loadingTypes = false;
        this.toast.error('Impossible de charger les types de questions');
      }
    });

    // Charger les matières pour le select
    this.matieresService.list().subscribe({
      next: (d) => (this.matieres = d || []),
      error: () => this.toast.error('Impossible de charger les matières')
    });

    // Charger les niveaux pour le select
    this.niveauxService.list().subscribe({
      next: (d) => (this.niveaux = d || []),
      error: () => this.toast.error('Impossible de charger les niveaux')
    });

    // Vérifier le mode édition
    this.route.params.subscribe(params => {
      const idParam = params['id'];
      if (idParam) {
        this.isEditMode = true;
        this.exerciceId = +idParam;
        // Attendre que les données de référence soient chargées avant de charger l'exercice
        forkJoin({
          matieres: this.matieresService.list(),
          niveaux: this.niveauxService.list()
        }).subscribe({
          next: (data) => {
            this.matieres = data.matieres || [];
            this.niveaux = data.niveaux || [];
            this.loadExistingExercice(this.exerciceId!);
          }
        });
      }
    });
  }

  private loadExistingExercice(id: number) {
    this.isLoading = true;
    // Charger l'exercice et ses questions en parallèle
    forkJoin({
      exercice: this.exercicesService.get(id),
      questions: this.questionsService.listByExercice(id)
    }).subscribe({
      next: ({ exercice, questions }) => {
        // Pré-remplir les champs de base
        this.exerciceForm.patchValue({
          matiereConcernee: exercice.matiere?.id?.toString() || '',
          titre: exercice.titre || '',
          description: exercice.description || '',
          niveauId: exercice.niveauScolaire?.id || null,
          niveauDifficulte: exercice.niveauDifficulte || 1,
          tempsAlloue: exercice.tempsAlloue || 10
        });

        // Charger les questions si elles existent
        if (questions && questions.length > 0) {
          // Vider le tableau de questions par défaut
          while (this.questions.length) {
            this.questions.removeAt(0);
          }

          // Ajouter chaque question au formulaire
          questions.forEach((q) => {
            const questionGroup = this.loadQuestionFromApi(q);
            this.questions.push(questionGroup);
          });
        }

        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.toast.error('Impossible de charger l\'exercice pour édition');
      }
    });
  }

  // Charger une question depuis l'API vers le formulaire
  private loadQuestionFromApi(question: any): FormGroup {
    const type = this.mapApiTypeToFront(question.type);
    let bonneReponse = '';
    const reponsesMap: { [key: string]: string } = {};

    // Mapper les réponses selon le type
    if (type === 'vrai_faux') {
      const vraiRep = question.reponses?.find((r: any) => r.libelle === 'VRAI');
      const fauxRep = question.reponses?.find((r: any) => r.libelle === 'FAUX');
      if (vraiRep?.estCorrecte) {
        bonneReponse = 'VRAI';
      } else if (fauxRep?.estCorrecte) {
        bonneReponse = 'FAUX';
      }
    } else if (question.reponses && question.reponses.length > 0) {
      // Pour les autres types, mapper les réponses aux lettres A, B, C, D
      const letters = ['A', 'B', 'C', 'D'];
      question.reponses.forEach((r: any, idx: number) => {
        if (idx < letters.length) {
          reponsesMap[letters[idx]] = r.libelle || '';
          if (r.estCorrecte) {
            bonneReponse = letters[idx];
          }
        }
      });
    }

    return this.fb.group({
      typeQuestion: [type, [Validators.required]],
      question: [question.enonce || '', [Validators.required, Validators.minLength(5)]],
      reponseA: [reponsesMap['A'] || ''],
      reponseB: [reponsesMap['B'] || ''],
      reponseC: [reponsesMap['C'] || ''],
      reponseD: [reponsesMap['D'] || ''],
      bonneReponse: [bonneReponse, [Validators.required]]
    });
  }

  // Mapper le type API vers le type frontend
  private mapApiTypeToFront(apiType: string): string {
    switch (apiType?.toUpperCase()) {
      case 'QCU':
        return 'choix_multiple';
      case 'QCM':
        return 'multi_reponse';
      case 'VRAI_FAUX':
        return 'vrai_faux';
      case 'APPARIEMENT':
        return 'appariement';
      default:
        return 'choix_multiple';
    }
  }

  // Getter pour accéder facilement au FormArray des questions
  get questions(): FormArray {
    return this.exerciceForm.get('questions') as FormArray;
  }

  // Création du formulaire réactif
  createForm(): FormGroup {
    return this.fb.group({
      // Informations de base
      matiereConcernee: ['', [Validators.required]],
      titre: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      niveauId: [null, [Validators.required]],
      niveauDifficulte: [1, [Validators.min(1), Validators.max(3)]],
      tempsAlloue: [10, [Validators.min(1)]],

      // Fichiers
      fichierPrincipal: [null],
      imageExercice: [null],

      // Questions (FormArray)
      questions: this.fb.array([this.createQuestion()])
    });
  }

  // Création d'une question
  createQuestion(): FormGroup {
    return this.fb.group({
      typeQuestion: ['', [Validators.required]],
      question: ['', [Validators.required, Validators.minLength(5)]],
      reponseA: [''],
      reponseB: [''],
      reponseC: [''],
      reponseD: [''],
      bonneReponse: ['', [Validators.required]]
    });
  }

  // Ajouter une nouvelle question
  ajouterQuestion(): void {
    this.questions.push(this.createQuestion());
  }

  // Supprimer une question
  supprimerQuestion(index: number): void {
    if (this.questions.length > 1) {
      this.questions.removeAt(index);
    }
  }

  // Gestion des fichiers
  onFileSelected(event: any, type: 'fichier' | 'image'): void {
    const file = event.target.files[0];
    if (file) {
      if (type === 'fichier') {
        this.exerciceForm.patchValue({ fichierPrincipal: file });
        console.log('Fichier sélectionné:', file.name);
      } else {
        this.exerciceForm.patchValue({ imageExercice: file });
        console.log('Image sélectionnée:', file.name);
      }
    }
  }

  // Drag and drop
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent, type: 'fichier' | 'image'): void {
    event.preventDefault();
    event.stopPropagation();

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (type === 'fichier') {
        this.exerciceForm.patchValue({ fichierPrincipal: file });
        console.log('Fichier déposé:', file.name);
      } else {
        this.exerciceForm.patchValue({ imageExercice: file });
        console.log('Image déposée:', file.name);
      }
    }
  }

  // Soumission du formulaire
  onSubmit(): void {
    if (!(this.exerciceForm.valid && this.validateQuestionsBySpec())) {
      this.marquerChampsCommeTouches();
      this.toast.error('Veuillez corriger les informations de l\'exercice et les questions avant de continuer.');
      return;
    }

    const file: File | null = this.exerciceForm.get('fichierPrincipal')?.value;
    let image: File | null = this.exerciceForm.get('imageExercice')?.value;

    if (!(file instanceof File)) {
      this.toast.error('Le fichier principal de l\'exercice est obligatoire pour créer l\'exercice.');
      return;
    }

    if (!(image instanceof File)) {
      image = null;
    }

    const payload = this.prepareExerciceData();

    this.isLoading = true;

    // Mode édition: mise à jour de l'exercice
    if (this.isEditMode && this.exerciceId) {
      // Pour la mise à jour, on ne met à jour que les données de base
      // Les questions et fichiers peuvent nécessiter une gestion séparée
      this.exercicesService.update(this.exerciceId, payload).subscribe({
        next: () => {
          this.isLoading = false;
          this.toast.success('Exercice mis à jour avec succès');
          this.router.navigate(['/admin/exercicelist']);
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Erreur lors de la mise à jour de l\'exercice:', err);
          this.toast.error('Erreur lors de la mise à jour de l\'exercice. Veuillez réessayer.');
        }
      });
      return;
    }

    // Mode création: créer l'exercice avec fichiers
    this.exercicesService.createWithFiles(payload, file, image).subscribe({
      next: (res) => {
        const exerciceId = (res as any)?.id;
        if (!exerciceId) {
          this.isLoading = false;
          this.toast.warning('Exercice créé, mais identifiant introuvable pour créer les questions associées.');
          this.confirmRedirectToList('Exercice créé sans ses questions, vous pourrez les ajouter plus tard.');
          return;
        }

        const questionRequests: CreateQuestionRequest[] = (this.questions.controls as FormGroup[]).map((qfg) => {
          const qv = qfg.value;
          const type = this.mapFrontTypeToApi(String(qv.typeQuestion || '').toLowerCase());
          if (type === 'VRAI_FAUX') {
            const reponses = [
              { libelle: 'VRAI', estCorrecte: String(qv.bonneReponse).toUpperCase() === 'VRAI' },
              { libelle: 'FAUX', estCorrecte: String(qv.bonneReponse).toUpperCase() === 'FAUX' }
            ];
            return { exerciceId, enonce: qv.question, points: 1, type, reponses };
          }
          const options: { libelle: string; estCorrecte: boolean }[] = [];
          const letters = ['A','B','C','D'];
          letters.forEach((L) => {
            const libelle = (qv[`reponse${L}`] || '').toString();
            if (libelle && libelle.trim() !== '') {
              options.push({ libelle, estCorrecte: String(qv.bonneReponse).toUpperCase() === L });
            }
          });
          return { exerciceId, enonce: qv.question, points: 1, type, reponses: options };
        });

        forkJoin(questionRequests.map(req => this.questionsService.createQuestion(req))).subscribe({
          next: () => {
            this.isLoading = false;
            this.confirmRedirectToList('Exercice et questions créés avec succès, il est prêt à être proposé aux apprenants.');
          },
          error: (err) => {
            this.isLoading = false;
            console.error('Erreur création questions exercice:', err);
            this.toast.error('Exercice créé, mais une erreur est survenue lors de la création des questions.');
            // On reste sur place pour permettre à l'utilisateur de corriger ou réessayer
          }
        });
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Erreur lors de la création de l\'exercice:', err);
        this.toast.error('Une erreur est survenue lors de la création de l\'exercice. Veuillez réessayer.');
      }
    });
  }

  private prepareExerciceData(): any {
    const v = this.exerciceForm.value;
    return {
      titre: v.titre,
      description: v.description,
      active: true,
      matiereId: +v.matiereConcernee,
      niveauId: v.niveauId ? +v.niveauId : undefined,
      niveauDifficulte: v.niveauDifficulte || 1,
      tempsAlloue: v.tempsAlloue || 10
    };
  }

  // Annulation
  onAnnuler(): void {
    this.confirm.confirm({
      title: 'Annuler',
      message: 'Voulez-vous vraiment annuler ? Toutes les modifications seront perdues.',
      confirmText: 'Annuler',
      cancelText: 'Continuer'
    }).then(ok => {
      if (ok) {
        this.exerciceForm.reset();
        this.router.navigate(['/admin/exercicelist']);
      }
    });
  }

  // Marquer tous les champs comme "touched" pour afficher les erreurs
  private marquerChampsCommeTouches(): void {
    Object.keys(this.exerciceForm.controls).forEach(key => {
      const control = this.exerciceForm.get(key);
      if (control instanceof FormGroup) {
        Object.keys(control.controls).forEach(subKey => {
          control.get(subKey)?.markAsTouched();
        });
      } else if (control instanceof FormArray) {
        // @ts-ignore
        control.controls.forEach((questionControl: FormGroup) => {
          Object.keys(questionControl.controls).forEach(subKey => {
            questionControl.get(subKey)?.markAsTouched();
          });
        });
      } else {
        control?.markAsTouched();
      }
    });
  }

  // Méthodes utilitaires pour le template
  estChampInvalide(nomChamp: string): boolean {
    const control = this.exerciceForm.get(nomChamp);
    return !!control && control.invalid && control.touched;
  }

  estQuestionInvalide(index: number, nomChamp: string): boolean {
    const question = this.questions.at(index) as FormGroup;
    const control = question.get(nomChamp);
    return !!control && control.invalid && control.touched;
  }

  // Getters pour les messages d'erreur
  getErrorMessage(nomChamp: string): string {
    const control = this.exerciceForm.get(nomChamp);
    if (control?.errors?.['required']) {
      return 'Ce champ est obligatoire';
    }
    if (control?.errors?.['minlength']) {
      return `Minimum ${control.errors?.['minlength'].requiredLength} caractères`;
    }
    return '';
  }

  getQuestionErrorMessage(index: number, nomChamp: string): string {
    const question = this.questions.at(index) as FormGroup;
    const control = question.get(nomChamp);
    if (control?.errors?.['required']) {
      return 'Ce champ est obligatoire';
    }
    if (control?.errors?.['minlength']) {
      return `Minimum ${control.errors?.['minlength'].requiredLength} caractères`;
    }
    return '';
  }

  private mapFrontTypeToApi(front: string): 'QCU' | 'QCM' | 'VRAI_FAUX' | 'APPARIEMENT' {
    switch (front) {
      case 'qcu':
      case 'choix_unique':
      case 'choix_multiple':
        return 'QCU';
      case 'qcm':
      case 'multi_reponse':
        return 'QCM';
      case 'vrai_faux':
        return 'VRAI_FAUX';
      case 'appariement':
        return 'APPARIEMENT';
      default:
        return 'QCU';
    }
  }

  private validateQuestionsBySpec(): boolean {
    return (this.questions.controls as FormGroup[]).every((qfg) => {
      const v = qfg.value;
      const type = this.mapFrontTypeToApi(String(v.typeQuestion || '').toLowerCase());
      if (!v.question || String(v.question).trim() === '') return false;
      if (type === 'VRAI_FAUX') {
        return ['VRAI', 'FAUX'].includes(String(v.bonneReponse).toUpperCase());
      }
      const options = ['A','B','C','D']
        .map(L => (v[`reponse${L}`] || '').toString())
        .filter(txt => txt.trim() !== '');
      if (options.length < 2) return false;
      const correctLetter = String(v.bonneReponse || '').toUpperCase();
      if (!['A','B','C','D'].includes(correctLetter)) return false;
      if (type === 'APPARIEMENT') {
        // UI not supporting pairs here, skip
        return false;
      }
      return true;
    });
  }

  private confirmRedirectToList(message: string) {
    this.confirm
      .confirm({
        title: 'Exercice créé',
        message,
        confirmText: 'Aller à la liste',
        cancelText: 'Rester ici'
      })
      .then((ok) => {
        if (ok) {
          this.router.navigate(['/admin/exercicelist']);
        }
      });
  }
}
