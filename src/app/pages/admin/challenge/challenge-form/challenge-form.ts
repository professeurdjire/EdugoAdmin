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
    return this.fb.group({
      typeQuestion: ['choix_multiple', Validators.required],
      question: ['', [Validators.required, Validators.minLength(5)]],
      points: [1, [Validators.min(1)]],
      reponses: this.fb.array([
        this.fb.group({ lettre: 'A', texte: '', correcte: false }),
        this.fb.group({ lettre: 'B', texte: '', correcte: false }),
        this.fb.group({ lettre: 'C', texte: '', correcte: false }),
        this.fb.group({ lettre: 'D', texte: '', correcte: false })
      ]),
      pairesAppariement: this.fb.array([])
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

  onReponseCorrecteChange(i: number, j: number) {
    const reps = this.getReponses(i);
    reps.controls.forEach((ctrl, idx) => ctrl.get('correcte')?.setValue(idx === j));
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
          this.router.navigate(['/admin/challengelist']);
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
            this.toast.success('Challenge et questions créés avec succès !');
            this.router.navigate(['/admin/challengelist']);
          },
          error: (err) => {
            this.isLoading = false;
            console.error('Erreur création questions du challenge:', err);
            this.toast.error('Challenge créé mais erreur lors de la création des questions');
            this.router.navigate(['/admin/challengelist']);
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
}
