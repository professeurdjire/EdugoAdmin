import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { ChallengesService } from '../../../../services/api/admin/challenges.service';
import { Challenge } from '../../../../api/model/challenge';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { NiveauxService } from '../../../../services/api/admin/niveaux.service';
import { ClassesService } from '../../../../services/api/admin/classes.service';
import { Niveau } from '../../../../api/model/niveau';
import { Classe } from '../../../../api/model/classe';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import { ConfirmService } from '../../../../shared/ui/confirm/confirm.service';
import { QuestionsService, CreateQuestionRequest } from '../../../../services/api/questions.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-challenge-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './challenge-form.html',
  styleUrls: ['./challenge-form.css']
})
export class ChallengeForm {
  isLoading = false;
  form: FormGroup;
  niveaux: Niveau[] = [];
  classes: Classe[] = [];
  loadingTypes = false;
  backendTypes: Array<{ id: number; libelle: string }> = [];

  typeOptions = [
    { value: Challenge.TypeChallengeEnum.Interclasse, label: 'Interclasse' },
    { value: Challenge.TypeChallengeEnum.Interniveau, label: 'Interniveau' }
  ];

  rewardModes = [
    { value: 'STANDARD', label: 'Standard' },
    { value: 'TOP3', label: 'Top 3' }
  ];

  // Types de questions disponibles (alignés sur Quiz)
  typesQuestions = [
    { value: 'choix_multiple', label: 'Choix multiple' },
    { value: 'multi_reponse', label: 'Multi-réponses' },
    { value: 'vrai_faux', label: 'Vrai / Faux' },
    { value: 'reponse_courte', label: 'Réponse courte' },
    { value: 'reponse_longue', label: 'Réponse longue' },
    { value: 'appariement', label: 'Appariement' },
    { value: 'ordre', label: 'Ordre' }
  ];

  constructor(
    private location: Location,
    private challengesService: ChallengesService,
    private router: Router,
    private fb: FormBuilder,
    private niveauxService: NiveauxService,
    private classesService: ClassesService,
    private toast: ToastService,
    private confirm: ConfirmService,
    private questionsService: QuestionsService
  ) {
    this.form = this.fb.group({
      typeChallenge: [this.typeOptions[0].value, Validators.required],
      titre: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      dateDebut: ['', Validators.required],
      dateFin: ['', Validators.required],
      rewardMode: [this.rewardModes[0].value, Validators.required],
      winnersCount: [1, [Validators.required, Validators.min(1)]],
      points: [0, [Validators.required, Validators.min(0)]],
      niveauId: [null],
      classeId: [null],
      questions: this.fb.array([this.createQuestionGroup()])
    });

    this.loadRefs();
    this.loadQuestionTypes();
  }

  // Formater une valeur provenant d'un input datetime-local en LocalDateTime (sans fuseau horaire)
  private toLocalDateTime(value: any): string | undefined {
    const v = String(value || '').trim();
    if (!v) return undefined;
    // v peut être 'YYYY-MM-DDTHH:mm' ou 'YYYY-MM-DDTHH:mm:ss'
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v)) {
      return v + ':00';
    }
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(v)) {
      return v;
    }
    // En dernier recours, tronquer à 19 caractères si dépasse
    return v.substring(0, 19);
  }

  private loadRefs() {
    this.niveauxService.list().subscribe({ next: (d) => (this.niveaux = d || []) });
    this.classesService.list().subscribe({ next: (d) => (this.classes = d || []) });
  }

  private loadQuestionTypes() {
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
  }

  get questions(): FormArray {
    return this.form.get('questions') as FormArray;
  }

  private createQuestionGroup(): FormGroup {
    return this.createQuestionGroupFromValue({
      typeQuestion: 'choix_multiple',
      question: '',
      points: 1,
      bonneReponse: '',
      reponses: [
        { lettre: 'A', texte: '', correcte: false },
        { lettre: 'B', texte: '', correcte: false },
        { lettre: 'C', texte: '', correcte: false },
        { lettre: 'D', texte: '', correcte: false }
      ],
      pairesAppariement: []
    });
  }

  private createQuestionGroupFromValue(val: any): FormGroup {
    const reponsesArray = new FormArray([] as any[]);
    (val.reponses || []).forEach((r: any) => {
      reponsesArray.push(
        this.fb.group({
          lettre: r.lettre,
          texte: r.texte,
          correcte: !!r.correcte
        })
      );
    });

    const pairesArray = new FormArray([] as any[]);
    (val.pairesAppariement || []).forEach((p: any) => {
      pairesArray.push(
        this.fb.group({
          elementGauche: p.elementGauche,
          elementDroit: p.elementDroit
        })
      );
    });

    // S'assurer qu'il y a au moins 2 réponses pour les QCM/QCU
    if (!reponsesArray.length) {
      reponsesArray.push(this.fb.group({ lettre: 'A', texte: '', correcte: false }));
      reponsesArray.push(this.fb.group({ lettre: 'B', texte: '', correcte: false }));
    }

    return this.fb.group({
      typeQuestion: [val.typeQuestion || 'choix_multiple', Validators.required],
      question: [val.question || '', [Validators.required, Validators.minLength(5)]],
      points: [val.points || 1, [Validators.min(1)]],
      bonneReponse: [val.bonneReponse || ''],
      reponses: reponsesArray,
      pairesAppariement: pairesArray
    });
  }

  getReponses(i: number): FormArray {
    return this.questions.at(i).get('reponses') as FormArray;
  }

  getPaires(i: number): FormArray {
    return this.questions.at(i).get('pairesAppariement') as FormArray;
  }

  ajouterQuestion() {
    this.questions.push(this.createQuestionGroup());
  }

  dupliquerQuestion(i: number) {
    const original = this.questions.at(i) as FormGroup;
    const clone = this.createQuestionGroupFromValue(original.value);
    this.questions.insert(i + 1, clone);
  }

  deplacerQuestion(i: number, direction: 'up' | 'down') {
    const target = direction === 'up' ? i - 1 : i + 1;
    if (target < 0 || target >= this.questions.length) return;
    const ctrl = this.questions.at(i);
    this.questions.removeAt(i);
    this.questions.insert(target, ctrl);
  }

  supprimerQuestion(i: number) {
    if (this.questions.length <= 1) return;
    this.questions.removeAt(i);
  }

  ajouterReponse(i: number) {
    const reps = this.getReponses(i);
    const lettre = String.fromCharCode(65 + reps.length);
    reps.push(this.fb.group({ lettre, texte: '', correcte: false }));
  }

  supprimerReponse(i: number, j: number) {
    const reps = this.getReponses(i);
    if (reps.length <= 2) return;
    reps.removeAt(j);
  }

  onReponseCorrecteChange(i: number, j: number, type: string) {
    const questionGroup = this.questions.at(i) as FormGroup;
    const reps = this.getReponses(i);

    if (type === 'multi_reponse' || type === 'case_a_cocher') {
      const current = reps.at(j);
      const newValue = !current.get('correcte')?.value;
      current.get('correcte')?.setValue(newValue);

      // Mettre à jour bonneReponse avec la liste des lettres correctes
      const letters = reps.controls
        .filter(ctrl => !!ctrl.get('correcte')?.value)
        .map(ctrl => String(ctrl.get('lettre')?.value || ''))
        .join(',');
      questionGroup.get('bonneReponse')?.setValue(letters);
      return;
    }

    // QCU / vrai_faux / ordre / autres : une seule bonne réponse
    reps.controls.forEach((ctrl, idx) => ctrl.get('correcte')?.setValue(idx === j));
    const selected = reps.at(j);
    const lettre = String(selected.get('lettre')?.value || '');
    questionGroup.get('bonneReponse')?.setValue(lettre);
  }

  ajouterPaireAppariement(i: number) {
    const p = this.getPaires(i);
    p.push(this.fb.group({ elementGauche: '', elementDroit: '' }));
  }

  supprimerPaireAppariement(i: number, j: number) {
    const p = this.getPaires(i);
    if (p.length <= 2) return;
    p.removeAt(j);
  }

  onTypeQuestionChange(i: number) {
    const qGroup = this.questions.at(i) as FormGroup;
    const type = String(qGroup.get('typeQuestion')?.value || 'choix_multiple');
    const reponses = qGroup.get('reponses') as FormArray;
    const paires = qGroup.get('pairesAppariement') as FormArray;

    // Réinitialiser certains champs
    qGroup.get('bonneReponse')?.setValue('');

    if (type === 'appariement') {
      // Pas de réponses classiques, seulement des paires
      while (reponses.length) reponses.removeAt(0);
      if (paires.length === 0) {
        paires.push(this.fb.group({ elementGauche: '', elementDroit: '' }));
        paires.push(this.fb.group({ elementGauche: '', elementDroit: '' }));
      }
      return;
    }

    if (type === 'vrai_faux') {
      // 2 réponses fixes Vrai/Faux
      while (paires.length) paires.removeAt(0);
      while (reponses.length) reponses.removeAt(0);
      reponses.push(this.fb.group({ lettre: 'V', texte: 'VRAI', correcte: false }));
      reponses.push(this.fb.group({ lettre: 'F', texte: 'FAUX', correcte: false }));
      return;
    }

    if (type === 'reponse_courte' || type === 'reponse_longue') {
      // Pas de réponses multiples ni de paires, seulement bonneReponse
      while (paires.length) paires.removeAt(0);
      while (reponses.length) reponses.removeAt(0);
      return;
    }

    // Types QCU / QCM / ordre : réponses classiques, pas de paires
    while (paires.length) paires.removeAt(0);
    if (reponses.length < 2) {
      while (reponses.length) reponses.removeAt(0);
      reponses.push(this.fb.group({ lettre: 'A', texte: '', correcte: false }));
      reponses.push(this.fb.group({ lettre: 'B', texte: '', correcte: false }));
    }
  }

  totalPoints(): number {
    return this.questions.controls.reduce((acc, ctrl: any) => acc + (ctrl.value.points || 0), 0);
  }

  getDescriptionType(type: string): string {
    const t = this.typesQuestions.find(x => x.value === type);
    return t ? t.label : '';
  }

  onRetour() {
    this.location.back();
  }

  onAnnuler() {
    this.confirm.confirm({
      title: 'Annuler',
      message: 'Voulez-vous vraiment annuler ? Toutes les modifications seront perdues.',
      confirmText: 'Annuler',
      cancelText: 'Continuer'
    }).then(ok => {
      if (ok) this.location.back();
    });
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.value;
    const payload: Partial<Challenge> = {
      titre: v.titre,
      description: v.description,
      points: v.points,
      rewardMode: v.rewardMode,
      typeChallenge: v.typeChallenge,
      dateDebut: this.toLocalDateTime(v.dateDebut) as any,
      dateFin: this.toLocalDateTime(v.dateFin) as any,
      niveau: v.niveauId ? { id: +v.niveauId } as any : undefined,
      classe: v.classeId ? { id: +v.classeId } as any : undefined,
      winnersCount: v.winnersCount
    } as any;

    this.isLoading = true;
    this.challengesService.create(payload).subscribe({
      next: (res) => {
        const challengeId = (res as any)?.id;
        if (!challengeId) {
          this.isLoading = false;
          this.toast.warning('Challenge créé mais identifiant introuvable pour créer les questions.');
          this.confirmRedirectToList('Challenge créé mais identifiant introuvable pour créer les questions.');
          return;
        }

        const questionRequests: CreateQuestionRequest[] = this.questions.controls.map((ctrl: any) => {
          const q = ctrl.value;
          const type = this.mapFrontTypeToApi(String(q.typeQuestion || '').toLowerCase());
          if (type === 'APPARIEMENT') {
            const paires = (q.pairesAppariement || []) as Array<{elementGauche:string;elementDroit:string}>;
            const reponses = paires.map(p => ({ libelle: `${p.elementGauche} - ${p.elementDroit}`, estCorrecte: true }));
            return { challengeId, enonce: q.question, points: q.points || 1, type, reponses };
          }
          if (type === 'VRAI_FAUX') {
            const reponses = [
              { libelle: 'VRAI', estCorrecte: (q.reponses || []).some((r:any)=> String(r.texte).toUpperCase()==='VRAI' && r.correcte) },
              { libelle: 'FAUX', estCorrecte: (q.reponses || []).some((r:any)=> String(r.texte).toUpperCase()==='FAUX' && r.correcte) }
            ];
            return { challengeId, enonce: q.question, points: q.points || 1, type, reponses };
          }
          const reponses = (q.reponses || []).map((r:any) => ({ libelle: r.texte, estCorrecte: !!r.correcte }));
          return { challengeId, enonce: q.question, points: q.points || 1, type, reponses };
        });

        forkJoin(questionRequests.map(req => this.questionsService.createQuestion(req))).subscribe({
          next: () => {
            this.isLoading = false;
            this.confirmRedirectToList('Le challenge et ses questions ont été créés avec succès.');
          },
          error: (err) => {
            this.isLoading = false;
            console.error('Erreur création questions du challenge:', err);
            this.toast.error('Challenge créé mais erreur lors de la création des questions');
            // On reste sur place pour permettre à l'utilisateur de corriger ou réessayer
          }
        });
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Erreur lors de la création du challenge:', err);
        this.toast.error('Erreur lors de la création du challenge. Veuillez réessayer.');
      }
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

  private confirmRedirectToList(message: string) {
    this.confirm
      .confirm({
        title: 'Challenge créé',
        message,
        confirmText: 'Aller à la liste',
        cancelText: 'Rester ici'
      })
      .then((ok) => {
        if (ok) {
          this.router.navigate(['/admin/challengelist']);
        }
      });
  }
}
