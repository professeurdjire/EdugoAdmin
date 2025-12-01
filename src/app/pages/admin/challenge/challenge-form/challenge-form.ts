import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Location } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
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
import { BadgesService } from '../../../../services/api/admin/badges.service';
import { BadgeResponse } from '../../../../api/model/badgeResponse';

@Component({
  selector: 'app-challenge-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './challenge-form.html',
  styleUrls: ['./challenge-form.css']
})
export class ChallengeForm implements OnInit {
  isLoading = false;
  form: FormGroup;
  niveaux: Niveau[] = [];
  classes: Classe[] = [];
  loadingTypes = false;
  backendTypes: Array<{ id: number; libelle: string }> = [];
  badges: BadgeResponse[] = [];
  isEditMode = false;
  challengeId: number | null = null;

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
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private niveauxService: NiveauxService,
    private classesService: ClassesService,
    private toast: ToastService,
    private confirm: ConfirmService,
    private questionsService: QuestionsService,
    private badgesService: BadgesService
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
      activerImmediat: [false],
      challengePrive: [false],
      badgeIds: [[]],
      questions: this.fb.array([this.createQuestionGroup()])
    });
  }

  ngOnInit(): void {
    this.loadRefs();
    this.loadQuestionTypes();
    this.loadBadges();

    // Vérifier le mode édition
    this.route.params.subscribe(params => {
      const idParam = params['id'];
      if (idParam) {
        this.isEditMode = true;
        this.challengeId = +idParam;
        // Attendre que les données de référence soient chargées avant de charger le challenge
        forkJoin({
          niveaux: this.niveauxService.list(),
          classes: this.classesService.list(),
          badges: this.badgesService.list()
        }).subscribe({
          next: (data) => {
            this.niveaux = data.niveaux || [];
            this.classes = data.classes || [];
            this.badges = data.badges || [];
            this.loadExistingChallenge(this.challengeId!);
          }
        });
      }
    });
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

  private loadExistingChallenge(id: number) {
    this.isLoading = true;
    // Charger le challenge et ses questions en parallèle
    forkJoin({
      challenge: this.challengesService.get(id),
      questions: this.questionsService.listByChallenge(id)
    }).subscribe({
      next: ({ challenge, questions }) => {
        const challengeAny = challenge as any;
        // Formater les dates pour l'input datetime-local
        const formatDateForInput = (dateStr: string | undefined): string => {
          if (!dateStr) return '';
          const date = new Date(dateStr);
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const hours = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');
          return `${year}-${month}-${day}T${hours}:${minutes}`;
        };

        // Pré-remplir les champs de base
        this.form.patchValue({
          typeChallenge: challenge.typeChallenge || this.typeOptions[0].value,
          titre: challenge.titre || '',
          description: challenge.description || '',
          dateDebut: formatDateForInput(challenge.dateDebut),
          dateFin: formatDateForInput(challenge.dateFin),
          rewardMode: challengeAny.rewardMode || this.rewardModes[0].value,
          winnersCount: challengeAny.winnersCount || 1,
          points: challenge.points || 0,
          niveauId: challenge.niveau?.id || null,
          classeId: challenge.classe?.id || null,
          badgeIds: challengeAny.badgeIds || []
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
        this.toast.error('Impossible de charger le challenge pour édition');
      }
    });
  }

  // Charger une question depuis l'API vers le formulaire
  private loadQuestionFromApi(question: any): FormGroup {
    const type = this.mapApiTypeToFront(question.type);
    
    // Gérer les réponses selon le type
    let reponsesArray = this.fb.array([]);
    let pairesArray = this.fb.array([]);

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
    } else if (question.reponses && question.reponses.length > 0) {
      // Pour les autres types, mapper les réponses
      question.reponses.forEach((r: any, idx: number) => {
        const lettre = String.fromCharCode(65 + idx);
        reponsesArray.push(this.fb.group({
          lettre: [lettre],
          texte: [r.libelle || ''],
          correcte: [r.estCorrecte || false]
        }) as any);
      });
    } else {
      // Pas de réponses, créer les réponses par défaut
      reponsesArray.push(this.fb.group({ lettre: ['A'], texte: [''], correcte: [false] }) as any);
      reponsesArray.push(this.fb.group({ lettre: ['B'], texte: [''], correcte: [false] }) as any);
    }

    return this.fb.group({
      typeQuestion: [type, Validators.required],
      question: [question.enonce || '', [Validators.required, Validators.minLength(5)]],
      points: [question.points || 1, [Validators.min(1)]],
      bonneReponse: [''],
      reponses: reponsesArray,
      pairesAppariement: pairesArray
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

  private loadBadges() {
    this.badgesService.list().subscribe({
      next: (badges) => {
        this.badges = badges || [];
      },
      error: () => {
        this.toast.error('Impossible de charger les badges disponibles');
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
      reponsesArray.push(this.fb.group({ lettre: 'A', texte: '', correcte: false }) as any);
      reponsesArray.push(this.fb.group({ lettre: 'B', texte: '', correcte: false }) as any);
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
    this.router.navigate(['/admin/challengelist']);
  }

  onAnnuler() {
    this.confirm.confirm({
      title: 'Annuler',
      message: 'Voulez-vous vraiment annuler ? Toutes les modifications seront perdues.',
      confirmText: 'Annuler',
      cancelText: 'Continuer'
    }).then(ok => {
      if (ok) {
        this.router.navigate(['/admin/challengelist']);
      }
    });
  }

  // Valider toutes les questions selon leur type
  private validateQuestions(): boolean {
    if (this.questions.length === 0) {
      this.toast.error('Veuillez ajouter au moins une question.');
      return false;
    }

    for (let i = 0; i < this.questions.length; i++) {
      const qGroup = this.questions.at(i) as FormGroup;
      const q = qGroup.value;
      const type = this.mapFrontTypeToApi(String(q.typeQuestion || '').toLowerCase());

      // Valider l'énoncé
      if (!q.question || String(q.question).trim() === '') {
        this.toast.error(`La question ${i + 1} doit avoir un énoncé.`);
        return false;
      }

      // Validation spécifique selon le type
      if (type === 'APPARIEMENT') {
        const paires = (q.pairesAppariement || []) as Array<{elementGauche:string;elementDroit:string}>;
        const pairesValides = paires.filter(p => 
          p && p.elementGauche && String(p.elementGauche).trim() !== '' && 
          p.elementDroit && String(p.elementDroit).trim() !== ''
        );
        
        if (pairesValides.length < 2) {
          this.toast.error(`La question ${i + 1} (Appariement) doit avoir au moins 2 paires complètes (élément gauche et élément droit remplis).`);
          return false;
        }
      } else if (type === 'VRAI_FAUX') {
        const reponses = q.reponses || [];
        const hasVrai = reponses.some((r: any) => String(r.texte).toUpperCase() === 'VRAI' && r.correcte);
        const hasFaux = reponses.some((r: any) => String(r.texte).toUpperCase() === 'FAUX' && r.correcte);
        if (!hasVrai && !hasFaux) {
          this.toast.error(`La question ${i + 1} (Vrai/Faux) doit avoir une bonne réponse sélectionnée.`);
          return false;
        }
      } else {
        // Pour QCU, QCM, etc.
        const reponses = q.reponses || [];
        const reponsesValides = reponses.filter((r: any) => r && r.texte && String(r.texte).trim() !== '');
        if (reponsesValides.length < 2) {
          this.toast.error(`La question ${i + 1} doit avoir au moins 2 réponses.`);
          return false;
        }
        if (type === 'QCU') {
          const bonnesReponses = reponsesValides.filter((r: any) => r.correcte);
          if (bonnesReponses.length !== 1) {
            this.toast.error(`La question ${i + 1} (QCU) doit avoir exactement une bonne réponse.`);
            return false;
          }
        } else if (type === 'QCM') {
          const bonnesReponses = reponsesValides.filter((r: any) => r.correcte);
          if (bonnesReponses.length < 1) {
            this.toast.error(`La question ${i + 1} (QCM) doit avoir au moins une bonne réponse.`);
            return false;
          }
        }
      }
    }

    return true;
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.error('Veuillez compléter correctement les informations du challenge et au moins une question.');
      return;
    }

    // Validation spécifique des questions
    if (!this.validateQuestions()) {
      return; // Le message d'erreur est déjà affiché dans validateQuestions()
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
      winnersCount: v.winnersCount,
      badgeIds: v.badgeIds ?? []
    } as any;

    this.isLoading = true;

    // Mode édition: mise à jour du challenge
    if (this.isEditMode && this.challengeId) {
      this.challengesService.update(this.challengeId, payload).subscribe({
        next: () => {
          this.isLoading = false;
          this.toast.success('Challenge mis à jour avec succès');
          this.router.navigate(['/admin/challengelist']);
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Erreur lors de la mise à jour du challenge:', err);
          this.toast.error('Erreur lors de la mise à jour du challenge. Veuillez réessayer.');
        }
      });
      return;
    }

    // Mode création: créer le challenge
    this.challengesService.create(payload).subscribe({
      next: (res) => {
        const challengeId = (res as any)?.id;
        if (!challengeId) {
          this.isLoading = false;
          this.toast.warning('Challenge créé, mais identifiant introuvable pour créer les questions associées.');
          this.confirmRedirectToList('Challenge créé sans ses questions, vous pourrez les ajouter plus tard.');
          return;
        }

        const questionRequests: CreateQuestionRequest[] = this.questions.controls.map((ctrl: any) => {
          const q = ctrl.value;
          const type = this.mapFrontTypeToApi(String(q.typeQuestion || '').toLowerCase());
          if (type === 'APPARIEMENT') {
            const paires = (q.pairesAppariement || []) as Array<{elementGauche:string;elementDroit:string}>;
            // Filtrer les paires vides et s'assurer qu'il y a au moins 2 paires valides
            const pairesValides = paires.filter(p => 
              p.elementGauche && String(p.elementGauche).trim() !== '' && 
              p.elementDroit && String(p.elementDroit).trim() !== ''
            );
            
            if (pairesValides.length < 2) {
              throw new Error('Pour une question de type Appariement, il faut au moins 2 paires complètes (élément gauche et élément droit remplis).');
            }
            
            const reponses = pairesValides.map(p => ({ 
              libelle: `${String(p.elementGauche).trim()} - ${String(p.elementDroit).trim()}`, 
              estCorrecte: true 
            }));
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

        // Valider toutes les questions avant de les envoyer
        for (const req of questionRequests) {
          if (req.type === 'APPARIEMENT') {
            if (!req.reponses || req.reponses.length < 2) {
              this.isLoading = false;
              this.toast.error('Pour une question de type Appariement, il faut au moins 2 paires complètes (élément gauche et élément droit remplis).');
              return;
            }
          }
        }

        forkJoin(questionRequests.map(req => this.questionsService.createQuestion(req))).subscribe({
          next: () => {
            this.isLoading = false;
            this.confirmRedirectToList('Le challenge et ses questions ont été créés avec succès, il est prêt à être lancé.');
          },
          error: (err) => {
            this.isLoading = false;
            console.error('Erreur création questions du challenge:', err);
            
            // Gérer les erreurs spécifiques
            const errorMessage = err.error?.message || err.message || err.error || '';
            const errorStr = String(errorMessage);
            
            if (errorStr.includes('APPARIEMENT') && (errorStr.includes('at least 4 options') || errorStr.includes('au moins 4'))) {
              this.toast.error('Pour une question de type Appariement, il faut au moins 2 paires complètes (2 éléments à gauche et 2 éléments à droite). Veuillez ajouter plus de paires dans votre question.');
            } else if (errorStr && errorStr.trim() !== '') {
              this.toast.error(`Erreur lors de la création des questions: ${errorStr}`);
            } else {
              this.toast.error('Challenge créé, mais une erreur est survenue lors de la création des questions. Veuillez vérifier que toutes les questions sont correctement remplies.');
            }
          }
        });
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Erreur lors de la création du challenge:', err);
        this.toast.error('Une erreur est survenue lors de la création du challenge. Veuillez réessayer.');
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
