import { Component, OnInit } from '@angular/core';
import {FormBuilder, FormGroup, FormArray, Validators, FormControl, ReactiveFormsModule} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { DefisService } from '../../../../services/api/admin/defis.service';
import { Defi } from '../../../../api/model/defi';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import { ConfirmService } from '../../../../shared/ui/confirm/confirm.service';
import { QuestionsService, CreateQuestionRequest } from '../../../../services/api/questions.service';
import { forkJoin } from 'rxjs';
import { ClassesService } from '../../../../services/api/admin/classes.service';
import { Classe } from '../../../../api/model/classe';

@Component({
  selector: 'app-defi-form',
  standalone:true,
  imports: [CommonModule, ReactiveFormsModule, FaIconComponent, RouterModule],
  templateUrl: './defi-form.html',
  styleUrls: ['./defi-form.css'],
})
export class DefiForm implements OnInit {
  faArrowLeft = faArrowLeft;
  defiForm: FormGroup;
  isLoading = false;
  loadingTypes = false;
  backendTypes: Array<{ id: number; libelle: string }> = [];
  classes: Classe[] = [];
  isEditMode = false;
  defiId: number | null = null;

  typesQuestions = [
    { value: 'choix_multiple', label: 'Choix multiple', icon: '📝' },
    { value: 'multi_reponse', label: 'Multi-réponse', icon: '✅' },
    { value: 'vrai_faux', label: 'Vrai / Faux', icon: '✔️' },
    { value: 'reponse_courte', label: 'Réponse courte', icon: '✍️' },
    { value: 'reponse_longue', label: 'Réponse longue', icon: '🧾' },
    { value: 'appariement', label: 'Appariement', icon: '🔗' },
    { value: 'ordre', label: 'Ordre', icon: '🔢' }
  ];

  niveauxDifficulte = [
    { value: 'facile', label: 'Facile' },
    { value: 'moyen', label: 'Moyen' },
    { value: 'difficile', label: 'Difficile' }
  ];

  // Types de défis proposés dans le formulaire (sélection au lieu de saisie libre)
  defiTypes = [
    { value: 'JOURNALIER', label: 'Journalier' },
    { value: 'HEBDOMADAIRE', label: 'Hebdomadaire' },
    { value: 'MENSUEL', label: 'Mensuel' }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private defisService: DefisService,
    private toast: ToastService,
    private confirm: ConfirmService,
    private questionsService: QuestionsService,
    private classesService: ClassesService
  ) {
    this.defiForm = this.createForm();
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

    // Charger les classes pour le select
    this.classesService.list().subscribe({
      next: (d) => (this.classes = d || []),
      error: () => this.toast.error('Impossible de charger les classes')
    });

    // Mode édition: récupération de l'ID dans l'URL
    this.route.params.subscribe(params => {
      const idParam = params['id'];
      if (idParam) {
        this.isEditMode = true;
        this.defiId = +idParam;
        this.loadExistingDefi(this.defiId);
      }
    });
  }

  private loadExistingDefi(id: number) {
    this.isLoading = true;
    // Charger le défi et ses questions en parallèle
    forkJoin({
      defi: this.defisService.get(id),
      questions: this.questionsService.listByDefi(id)
    }).subscribe({
      next: ({ defi, questions }) => {
        // Pré-remplir les champs de base
        this.defiForm.patchValue({
          classeConcernee: defi.classe?.id?.toString() || '',
          titre: defi.titre || '',
          description: defi.ennonce || '',
          typeDefis: defi.typeDefi || '',
          dateAjout: this.toLocalDateTimeInput(defi.dateAjout)
        });

        // Charger les questions si elles existent
        if (questions && questions.length > 0) {
          // Vider le tableau de questions par défaut
          while (this.questions.length) {
            this.questions.removeAt(0);
          }

          // Ajouter chaque question au formulaire
          questions.forEach((q, index) => {
            const questionGroup = this.loadQuestionFromApi(q, index + 1);
            this.questions.push(questionGroup);
          });
        }

        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.toast.error('Impossible de charger le défi pour édition');
      }
    });
  }

  // Charger une question depuis l'API vers le formulaire
  private loadQuestionFromApi(question: any, numero: number): FormGroup {
    const type = this.mapApiTypeToFront(question.type);
    
    // Gérer les réponses selon le type
    let reponsesArray = this.fb.array([]);
    let pairesArray = this.fb.array([]);
    let bonneReponse = '';

    if (type === 'appariement') {
      // Pour l'appariement, parser les réponses comme des paires
      if (question.reponses && question.reponses.length > 0) {
        question.reponses.forEach((r: any) => {
          const parts = r.libelle.split(' - ');
          if (parts.length === 2) {
            pairesArray.push(this.fb.group({
              elementGauche: [parts[0]],
              elementDroit: [parts[1]]
            }) as any);
          }
        });
      }
    } else if (type === 'vrai_faux') {
      // Pour Vrai/Faux, créer les deux réponses
      const vraiRep = question.reponses?.find((r: any) => r.libelle === 'VRAI');
      const fauxRep = question.reponses?.find((r: any) => r.libelle === 'FAUX');
      reponsesArray.push(this.fb.group({ lettre: ['V'], texte: ['VRAI'], correcte: [vraiRep?.estCorrecte || false] }) as any);
      reponsesArray.push(this.fb.group({ lettre: ['F'], texte: ['FAUX'], correcte: [fauxRep?.estCorrecte || false] }) as any);
      if (vraiRep?.estCorrecte) bonneReponse = 'V';
      else if (fauxRep?.estCorrecte) bonneReponse = 'F';
    } else if (question.reponses && question.reponses.length > 0) {
      // Pour les autres types, mapper les réponses
      question.reponses.forEach((r: any, idx: number) => {
        const lettre = String.fromCharCode(65 + idx);
        reponsesArray.push(this.fb.group({
          lettre: [lettre],
          texte: [r.libelle || ''],
          correcte: [r.estCorrecte || false]
        }) as any);
        if (r.estCorrecte) {
          if (type === 'multi_reponse') {
            bonneReponse = bonneReponse ? `${bonneReponse},${lettre}` : lettre;
          } else {
            bonneReponse = lettre;
          }
        }
      });
    } else {
      // Pas de réponses, créer les réponses par défaut
      this.defaultReponses().forEach(g => reponsesArray.push(g as any));
    }

    return this.fb.group({
      numero: [numero],
      typeQuestion: [type, [Validators.required]],
      question: [question.enonce || '', [Validators.required, Validators.minLength(5)]],
      points: [question.points || 1],
      reponses: reponsesArray,
      pairesAppariement: pairesArray,
      bonneReponse: [bonneReponse]
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
    return this.defiForm.get('questions') as FormArray;
  }

  // Création du formulaire réactif
  createForm(): FormGroup {
    return this.fb.group({
      // Informations de base
      classeConcernee: ['', [Validators.required]],
      titre: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      typeDefis: ['', [Validators.required]],
      dateAjout: ['', [Validators.required]],

      // Questions (FormArray)
      questions: this.fb.array([this.createQuestionGroup(1)])
    });
  }

  // Create a question group with dynamic reponses array
  createQuestionGroup(numero: number) {
    return this.fb.group({
      numero: [numero],
      typeQuestion: ['choix_multiple', [Validators.required]],
      question: ['', [Validators.required, Validators.minLength(5)]],
      points: [1],
      reponses: this.fb.array(this.defaultReponses()),
      pairesAppariement: this.fb.array([]),
      bonneReponse: ['']
    });
  }

  defaultReponses() {
    // default 4 answers A-D
    const letters = ['A','B','C','D'];
    return letters.map(l => this.fb.group({ lettre: [l], texte: [''], correcte: [false] }));
  }

  // Ajouter une nouvelle question
  ajouterQuestion(): void {
    const nouveauNumero = this.questions.length + 1;
    this.questions.push(this.createQuestionGroup(nouveauNumero));
  }

  // Dupliquer
  dupliquerQuestion(index: number) {
    const q = this.questions.at(index).value;
    const copie = JSON.parse(JSON.stringify(q));
    copie.numero = this.questions.length + 1;
    this.questions.insert(index + 1, this.fb.group(copie));
    this.renumeroterQuestions();
  }

  // Déplacer
  deplacerQuestion(index: number, direction: 'up' | 'down') {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= this.questions.length) return;
    const from = this.questions.at(index);
    const to = this.questions.at(target);
    const temp = from.value;
    from.setValue(to.value);
    to.setValue(temp);
    this.renumeroterQuestions();
  }

  renumeroterQuestions() {
    this.questions.controls.forEach((c, i) => c.get('numero')?.setValue(i + 1));
  }

  // Supprimer une question
  supprimerQuestion(index: number): void {
    if (this.questions.length > 1) {
      this.questions.removeAt(index);
      this.renumeroterQuestions();
    }
  }

  // Réponses management
  getReponses(questionIndex: number): FormArray {
    return this.questions.at(questionIndex).get('reponses') as FormArray;
  }

  getPaires(questionIndex: number): FormArray {
    return this.questions.at(questionIndex).get('pairesAppariement') as FormArray;
  }

  ajouterReponse(questionIndex: number) {
    const reponses = this.getReponses(questionIndex);
    const lettre = String.fromCharCode(65 + reponses.length);
    reponses.push(this.fb.group({ lettre: [lettre], texte: [''], correcte: [false] }));
  }

  supprimerReponse(questionIndex: number, reponseIndex: number) {
    const reponses = this.getReponses(questionIndex);
    if (reponses.length <= 2) return;
    reponses.removeAt(reponseIndex);
  }

  onReponseCorrecteChange(questionIndex: number, reponseIndex: number, type: string) {
    const reponses = this.getReponses(questionIndex);
    if (type === 'multi_reponse' || type === 'case_a_cocher') {
      const ctrl = reponses.at(reponseIndex);
      ctrl.get('correcte')?.setValue(!ctrl.get('correcte')?.value);
    } else {
      // single choice: only one true
      reponses.controls.forEach((r, i) => r.get('correcte')?.setValue(i === reponseIndex));
    }
  }

  // Appariement
  ajouterPaireAppariement(questionIndex: number) {
    const paires = this.questions.at(questionIndex).get('pairesAppariement') as FormArray;
    paires.push(this.fb.group({ elementGauche: [''], elementDroit: [''] }));
  }

  supprimerPaireAppariement(questionIndex: number, paireIndex: number) {
    const paires = this.questions.at(questionIndex).get('pairesAppariement') as FormArray;
    if (paires.length <= 2) return;
    paires.removeAt(paireIndex);
  }

  // Changement de type de question (comportement proche de quiz-form)
  onTypeQuestionChange(index: number) {
    const questionCtrl = this.questions.at(index) as FormGroup;
    let type = String(questionCtrl.get('typeQuestion')?.value || 'choix_multiple');

    const reponses = this.getReponses(index);
    const paires = this.getPaires(index);

    if (type === 'appariement') {
      // Réinitialiser les paires si nécessaire
      while (reponses.length) {
        reponses.removeAt(0);
      }
      if (paires.length === 0) {
        paires.push(this.fb.group({ elementGauche: [''], elementDroit: [''] }));
        paires.push(this.fb.group({ elementGauche: [''], elementDroit: [''] }));
      }
      questionCtrl.get('bonneReponse')?.setValue('');
      return;
    }

    // Types sans réponses prédéfinies
    if (type === 'reponse_courte' || type === 'reponse_longue') {
      while (reponses.length) {
        reponses.removeAt(0);
      }
      while (paires.length) {
        paires.removeAt(0);
      }
      questionCtrl.get('bonneReponse')?.setValue('');
      return;
    }

    // Type VRAI_FAUX : réponses fixes Vrai / Faux
    if (type === 'vrai_faux') {
      while (reponses.length) {
        reponses.removeAt(0);
      }
      while (paires.length) {
        paires.removeAt(0);
      }
      reponses.push(this.fb.group({ lettre: ['V'], texte: ['VRAI'], correcte: [false] }));
      reponses.push(this.fb.group({ lettre: ['F'], texte: ['FAUX'], correcte: [false] }));
      questionCtrl.get('bonneReponse')?.setValue('');
      return;
    }

    // Types à choix (QCU/QCM/case à cocher/ordre)
    while (paires.length) {
      paires.removeAt(0);
    }
    if (reponses.length < 2) {
      while (reponses.length) {
        reponses.removeAt(0);
      }
      this.defaultReponses().forEach(g => reponses.push(g as any));
    }
  }

  // Soumission du formulaire
  onSubmit(): void {
    if (this.defiForm.valid && this.validateQuestionsBySpec()) {
      const formData = this.defiForm.value;
      const payload: Partial<Defi> = {
        titre: formData.titre,
        ennonce: formData.description,
        dateAjout: this.fromLocalDateTimeInput(formData.dateAjout),
        typeDefi: formData.typeDefis,
        pointDefi: this.totalPoints(),
        classe: formData.classeConcernee ? { id: +formData.classeConcernee } : undefined
      };

      this.isLoading = true;

      // Edition: mise à jour du défi sans recréer les questions pour l'instant
      if (this.isEditMode && this.defiId) {
        this.defisService.update(this.defiId, payload).subscribe({
          next: () => {
            this.isLoading = false;
            this.confirmRedirectToList('Le défi a été mis à jour avec succès.');
          },
          error: (err) => {
            this.isLoading = false;
            console.error('Erreur lors de la mise à jour du défi:', err);
            this.toast.error('Erreur lors de la mise à jour du défi. Veuillez réessayer.');
          }
        });
        return;
      }

      // Création: on crée le défi puis les questions associées
      this.defisService.create(payload).subscribe({
        next: (res) => {
          const defiId = (res as any)?.id;
          if (!defiId) {
            this.isLoading = false;
            this.toast.warning('Défi créé mais identifiant introuvable pour créer les questions.');
            this.confirmRedirectToList('Défi créé mais identifiant introuvable pour créer les questions.');
            return;
          }

          const questionRequests: CreateQuestionRequest[] = this.questions.controls.map((ctrl: any) => {
            const v = ctrl.value;
            const type = this.mapFrontTypeToApi(String(v.typeQuestion || '').toLowerCase());
            if (type === 'APPARIEMENT') {
              const paires = (v.pairesAppariement || []) as Array<{elementGauche:string;elementDroit:string}>;
              const reponses = paires.map(p => ({ libelle: `${p.elementGauche} - ${p.elementDroit}`, estCorrecte: true }));
              return { defiId, enonce: v.question, points: v.points || 1, type, reponses };
            }
            if (type === 'VRAI_FAUX') {
              const reponses = [
                { libelle: 'VRAI', estCorrecte: (v.reponses || []).some((r:any)=> String(r.texte).toUpperCase()==='VRAI' && r.correcte) },
                { libelle: 'FAUX', estCorrecte: (v.reponses || []).some((r:any)=> String(r.texte).toUpperCase()==='FAUX' && r.correcte) }
              ];
              return { defiId, enonce: v.question, points: v.points || 1, type, reponses };
            }
            const reponses = (v.reponses || []).map((r:any) => ({ libelle: r.texte, estCorrecte: !!r.correcte }));
            return { defiId, enonce: v.question, points: v.points || 1, type, reponses };
          });

          forkJoin(questionRequests.map(req => this.questionsService.createQuestion(req))).subscribe({
            next: () => {
              this.isLoading = false;
              this.confirmRedirectToList('Le défi et ses questions ont été créés avec succès.');
            },
            error: (err) => {
              this.isLoading = false;
              console.error('Erreur création questions du défi:', err);
              this.toast.error('Défi créé mais erreur lors de la création des questions');
              // On reste sur place pour permettre à l'utilisateur de corriger ou réessayer
            }
          });
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Erreur lors de la création du défi:', err);
          this.toast.error('Erreur lors de la création du défi. Veuillez réessayer.');
        }
      });
    } else {
      this.marquerChampsCommeTouches();
    }
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
        this.defiForm.reset();
        this.router.navigate(['/admin/defilist']);
      }
    });
  }

  // Marquer tous les champs comme "touched" pour afficher les erreurs
  private marquerChampsCommeTouches(): void {
    Object.keys(this.defiForm.controls).forEach(key => {
      const control = this.defiForm.get(key);
      if (control instanceof FormGroup) {
        Object.keys(control.controls).forEach(subKey => {
          control.get(subKey)?.markAsTouched();
        });
      } else if (control instanceof FormArray) {
        // @ts-ignore
        control.controls.forEach((questionControl: FormGroup) => {
          Object.keys(questionControl.controls).forEach(subKey => {
            questionControl.get(subKey)?.markAsTouched();
            const nested = questionControl.get(subKey);
            if (nested instanceof FormArray) {
              nested.controls.forEach((c: any) => c.markAsTouched && c.markAsTouched());
            }
          });
        });
      } else {
        control?.markAsTouched();
      }
    });
  }

  // Helpers
  totalPoints(): number {
    return this.questions.controls.reduce((acc, q: any) => acc + (q.get('points')?.value || 0), 0);
  }

  estFormulaireValide(): boolean {
    return this.defiForm.valid;
  }

  getDescriptionType(type: string): string {
    const t = this.typesQuestions.find(x => x.value === type);
    return t ? t.label : '';
  }

  private validateQuestionsBySpec(): boolean {
    return this.questions.controls.every((ctrl: any) => {
      const v = ctrl.value;
      if (!v.question || String(v.question).trim() === '') return false;
      const type = this.mapFrontTypeToApi(String(v.typeQuestion || '').toLowerCase());
      if (type === 'QCU') {
        const reps = v.reponses || [];
        return reps.length >= 2 && reps.filter((r:any)=>!!r.correcte).length === 1 && reps.every((r:any)=> String(r.texte||'').trim() !== '');
      }
      if (type === 'QCM') {
        const reps = v.reponses || [];
        return reps.length >= 2 && reps.filter((r:any)=>!!r.correcte).length >= 1 && reps.every((r:any)=> String(r.texte||'').trim() !== '');
      }
      if (type === 'VRAI_FAUX') {
        const reps = v.reponses || [];
        return reps.length === 2 && reps.filter((r:any)=>!!r.correcte).length === 1;
      }
      if (type === 'APPARIEMENT') {
        const p = v.pairesAppariement || [];
        return p.length >= 2 && p.every((x:any)=> String(x.elementGauche||'').trim()!=='' && String(x.elementDroit||'').trim()!=='' );
      }
      return true;
    });
  }

  private mapFrontTypeToApi(front: string): 'QCU' | 'QCM' | 'VRAI_FAUX' | 'APPARIEMENT' {
    switch (front) {
      case 'choix_multiple':
        return 'QCU';
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

  private toLocalDateTimeInput(value?: string | null): string {
    if (!value) {
      return '';
    }
    // Supposons un format ISO ou LocalDateTime (ex: 2025-11-16T01:30:00)
    // L'input datetime-local attend "YYYY-MM-DDTHH:mm"
    if (value.length >= 16) {
      return value.substring(0, 16);
    }
    return value;
  }

  private fromLocalDateTimeInput(value?: string | null): string | undefined {
    if (!value) {
      return undefined;
    }
    // Si pas de secondes, on ajoute ":00" pour avoir un LocalDateTime complet
    if (value.length === 16) {
      return value + ':00';
    }
    return value;
  }

  private confirmRedirectToList(message: string) {
    this.confirm
      .confirm({
        title: this.isEditMode ? 'Défi mis à jour' : 'Défi créé',
        message,
        confirmText: 'Aller à la liste',
        cancelText: 'Rester ici'
      })
      .then((ok) => {
        if (ok) {
          this.router.navigate(['/admin/defilist']);
        }
      });
  }
}