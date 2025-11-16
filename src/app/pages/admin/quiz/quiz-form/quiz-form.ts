import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { QuizzesService } from '../../../../api/api/quizzes.service';
import { Quiz as ApiQuiz } from '../../../../api/model/quiz';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import { ConfirmService } from '../../../../shared/ui/confirm/confirm.service';
import { QuestionsService, CreateQuestionRequest } from '../../../../services/api/questions.service';
import { forkJoin } from 'rxjs';
import { LivresService } from '../../../../services/api/admin/livres.service';
import { Livre } from '../../../../api/model/livre';

interface Reponse {
  lettre: string;
  texte: string;
  correcte?: boolean;
}

interface AppariementPaire {
  elementGauche: string;
  elementDroit: string;
}

interface Question {
  numero: number;
  type: string;
  question: string;
  points?: number;
  reponses: Reponse[];
  bonneReponse?: string;
  pairesAppariement?: AppariementPaire[];
}

interface QuizDraft {
  livreAssocie: string;
  titre: string;
  description: string;
  duree?: number;
  difficulte?: string;
  questions: Question[];
}

@Component({
  selector: 'app-quiz-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './quiz-form.html',
  styleUrls: ['./quiz-form.css']
})
export class QuizForm {
  quiz: QuizDraft = {
    livreAssocie: '',
    titre: '',
    description: '',
    duree: 30,
    difficulte: 'moyen',
    questions: [
      {
        numero: 1,
        type: 'choix_multiple',
        question: '',
        points: 1,
        reponses: [
          { lettre: 'A', texte: '', correcte: false },
          { lettre: 'B', texte: '', correcte: false },
          { lettre: 'C', texte: '', correcte: false },
          { lettre: 'D', texte: '', correcte: false }
        ],
        bonneReponse: ''
      }
    ]
  };

  typesQuestions = [
    { value: 'choix_multiple', icon: '', label: 'Choix multiple' },
    { value: 'multi_reponse', icon: '', label: 'Multi-rponse' },
    { value: 'vrai_faux', icon: '', label: 'Vrai / Faux' },
    { value: 'reponse_courte', icon: '', label: 'Rponse courte' },
    { value: 'reponse_longue', icon: '', label: 'Rponse longue' },
    { value: 'appariement', icon: '', label: 'Appariement' },
    { value: 'ordre', icon: '', label: 'Ordre' }
  ];

  niveauxDifficulte = [
    { value: 'facile', label: 'Facile' },
    { value: 'moyen', label: 'Moyen' },
    { value: 'difficile', label: 'Difficile' }
  ];

  isLoading = false;
  loadingTypes = false;
  backendTypes: Array<{ id: number; libelle: string }> = [];
  livres: Livre[] = [];
  selectedLivreId: number | null = null;
  isEditMode = false;
  quizId: number | null = null;

  constructor(
    private quizzesService: QuizzesService,
    private router: Router,
    private route: ActivatedRoute,
    private toast: ToastService,
    private confirm: ConfirmService,
    private questionsService: QuestionsService,
    private livresService: LivresService
  ) {}

  ngOnInit() {
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

    // Charger les livres depuis le backend pour le select
    this.livresService.list().subscribe({
      next: (data) => {
        this.livres = data || [];
        if (this.livres.length > 0) {
          this.selectedLivreId = this.livres[0].id || null;
        }
      },
      error: () => {
        this.toast.error('Impossible de charger la liste des livres');
      }
    });

    // Déterminer si on est en mode édition via l'ID dans l'URL
    this.route.params.subscribe(params => {
      const idParam = params['id'];
      if (idParam) {
        this.isEditMode = true;
        this.quizId = +idParam;
        this.loadExistingQuiz(this.quizId);
      }
    });
  }

  private loadExistingQuiz(id: number) {
    this.isLoading = true;
    this.quizzesService.getQuizById(id).subscribe({
      next: (res: any) => {
        // Adapter les champs disponibles de QuizResponse
        this.quiz.titre = res.titre || '';
        this.quiz.description = res.description || '';

        if (res.duree != null) {
          this.quiz.duree = res.duree;
        }
        if (res.difficulte) {
          this.quiz.difficulte = res.difficulte;
        }

        // Tenter de pré-sélectionner le livre à partir de titreLivre
        if (res.titreLivre && this.livres && this.livres.length) {
          const match = this.livres.find(l => l.titre === res.titreLivre);
          if (match && match.id) {
            this.selectedLivreId = match.id;
          }
        }

        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.toast.error('Impossible de charger le quiz pour édition');
      }
    });
  }

  onRetour() {
    history.back();
  }

  onAnnuler() {
    this.confirm
      .confirm({
        title: 'Annuler',
        message: 'Voulez-vous vraiment annuler ? Toutes les modifications seront perdues.',
        confirmText: 'Annuler',
        cancelText: 'Continuer'
      })
      .then((ok) => {
        if (ok) this.resetQuiz();
      });
  }

  resetQuiz() {
    this.quiz = {
      livreAssocie: '',
      titre: '',
      description: '',
      duree: 30,
      difficulte: 'moyen',
      questions: [
        {
          numero: 1,
          type: 'choix_multiple',
          question: '',
          points: 1,
          reponses: [
            { lettre: 'A', texte: '', correcte: false },
            { lettre: 'B', texte: '', correcte: false },
            { lettre: 'C', texte: '', correcte: false },
            { lettre: 'D', texte: '', correcte: false }
          ],
          bonneReponse: ''
        }
      ]
    };
  }

  // Gestion des questions
  ajouterQuestion() {
    const nouveauNumero = this.quiz.questions.length + 1;
    this.quiz.questions.push({
      numero: nouveauNumero,
      type: 'choix_multiple',
      question: '',
      points: 1,
      reponses: [
        { lettre: 'A', texte: '', correcte: false },
        { lettre: 'B', texte: '', correcte: false }
      ],
      bonneReponse: ''
    });
  }

  dupliquerQuestion(index: number) {
    const q = this.quiz.questions[index];
    const copie: Question = JSON.parse(JSON.stringify(q));
    copie.numero = this.quiz.questions.length + 1;
    this.quiz.questions.splice(index + 1, 0, copie);
    this.renumeroterQuestions();
  }

  deplacerQuestion(index: number, direction: 'up' | 'down') {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= this.quiz.questions.length) return;
    const tmp = this.quiz.questions[target];
    this.quiz.questions[target] = this.quiz.questions[index];
    this.quiz.questions[index] = tmp;
    this.renumeroterQuestions();
  }

  supprimerQuestion(index: number) {
    if (this.quiz.questions.length <= 1) return;
    this.quiz.questions.splice(index, 1);
    this.renumeroterQuestions();
  }

  renumeroterQuestions() {
    this.quiz.questions.forEach((q, i) => (q.numero = i + 1));
  }

  // Changement de type de question
  onTypeQuestionChange(index: number) {
    const q = this.quiz.questions[index];
    if (!q.type) q.type = 'choix_multiple';
    
    if (q.type === 'appariement') {
      q.bonneReponse = '';
      q.reponses = [];
      if (!q.pairesAppariement || q.pairesAppariement.length === 0) {
        q.pairesAppariement = [
          { elementGauche: '', elementDroit: '' },
          { elementGauche: '', elementDroit: '' }
        ];
      }
      return;
    }

    if (q.type === 'vrai_faux') {
      q.pairesAppariement = [];
      q.reponses = [
        { lettre: 'V', texte: 'Vrai', correcte: false },
        { lettre: 'F', texte: 'Faux', correcte: false }
      ];
      q.bonneReponse = '';
      return;
    }

    if (q.type === 'reponse_courte' || q.type === 'reponse_longue') {
      q.pairesAppariement = [];
      q.reponses = [];
      q.bonneReponse = '';
      return;
    }

    if (!q.reponses || q.reponses.length < 2) {
      q.reponses = [
        { lettre: 'A', texte: '', correcte: false },
        { lettre: 'B', texte: '', correcte: false }
      ];
    }
    q.pairesAppariement = [];
  }

  // Gestion des réponses
  ajouterReponse(questionIndex: number) {
    const q = this.quiz.questions[questionIndex];
    const nextLetter = String.fromCharCode(65 + q.reponses.length);
    q.reponses.push({ lettre: nextLetter, texte: '', correcte: false });
  }

  supprimerReponse(questionIndex: number, reponseIndex: number) {
    const q = this.quiz.questions[questionIndex];
    if (q.reponses.length <= 2) return;
    q.reponses.splice(reponseIndex, 1);
  }

  onReponseCorrecteChange(questionIndex: number, reponseIndex: number, type: string) {
    const q = this.quiz.questions[questionIndex];
    if (type === 'multi_reponse' || type === 'case_a_cocher') {
      q.reponses[reponseIndex].correcte = !q.reponses[reponseIndex].correcte;
      const letters = q.reponses
        .filter(r => r.correcte)
        .map(r => r.lettre)
        .join(',');
      q.bonneReponse = letters;
    } else {
      q.reponses.forEach((r, i) => (r.correcte = i === reponseIndex));
      q.bonneReponse = q.reponses[reponseIndex]?.lettre ?? '';
    }
  }

  // Gestion de l'appariement
  ajouterPaireAppariement(questionIndex: number) {
    const q = this.quiz.questions[questionIndex];
    if (!q.pairesAppariement) q.pairesAppariement = [];
    q.pairesAppariement.push({ elementGauche: '', elementDroit: '' });
  }

  supprimerPaireAppariement(questionIndex: number, paireIndex: number) {
    const q = this.quiz.questions[questionIndex];
    if (!q.pairesAppariement || q.pairesAppariement.length <= 2) return;
    q.pairesAppariement.splice(paireIndex, 1);
  }

  // Utilitaires
  totalPoints(): number {
    return this.quiz.questions.reduce((acc, q) => acc + (q.points || 0), 0);
  }

  getDescriptionType(type: string) {
    const t = this.typesQuestions.find(x => x.value === type);
    return t ? t.label : '';
  }

  estFormulaireValide(): boolean {
    if (!this.quiz.titre || this.quiz.titre.trim() === '') return false;
    if (!this.selectedLivreId) return false;
    if (!this.quiz.questions || this.quiz.questions.length === 0) return false;
    
    // Validation des questions
    return this.quiz.questions.every(q => {
      if (!q.question || q.question.trim() === '') return false;
      if (!q.points || q.points < 1) return false;
      
      // Validation selon le type de question
      return this.validateQuestionBySpec(q);
    });
  }

  private validateQuestionBySpec(q: Question): boolean {
    const type = this.mapFrontTypeToApi(q.type);
    if (type === 'QCU') {
      return !!q.reponses && q.reponses.length >= 2 && q.reponses.filter(r => !!r.correcte).length === 1 && q.reponses.every(r => r.texte.trim() !== '');
    }
    if (type === 'QCM') {
      return !!q.reponses && q.reponses.length >= 2 && q.reponses.filter(r => !!r.correcte).length >= 1 && q.reponses.every(r => r.texte.trim() !== '');
    }
    if (type === 'VRAI_FAUX') {
      return !!q.reponses && q.reponses.length === 2 && q.reponses.filter(r => !!r.correcte).length === 1;
    }
    if (type === 'APPARIEMENT') {
      return !!q.pairesAppariement && q.pairesAppariement.length >= 2 && q.pairesAppariement.every(p => p.elementGauche.trim() !== '' && p.elementDroit.trim() !== '');
    }
    return true;
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

  // Enregistrement du quiz
  onEnregistrerQuiz() {
    if (!this.estFormulaireValide()) {
      this.toast.warning('Veuillez remplir tous les champs obligatoires et vrifier les questions.');
      return;
    }

    this.isLoading = true;

    // Transformation des données pour l'API (création ou mise à jour)
    const payload = {
      titre: this.quiz.titre,
      description: this.quiz.description,
      duree: this.quiz.duree,
      difficulte: this.quiz.difficulte,
      // ID du livre requis par le backend
      livreId: this.selectedLivreId!,
      // Optionnel: nom du livre pour affichage côté front/back si toléré
      livreAssocie: (this.livres.find(l => l.id === this.selectedLivreId)?.titre) || this.quiz.livreAssocie,
      statut: ApiQuiz.StatutEnum.Brouillon,
      nombreQuestions: this.quiz.questions.length,
      questions: this.quiz.questions.map(q => ({
        numero: q.numero,
        type: q.type,
        question: q.question,
        points: q.points,
        reponses: q.reponses,
        bonneReponse: q.bonneReponse,
        pairesAppariement: q.pairesAppariement
      }))
    };

    // Mode édition : on met à jour le quiz sans recréer les questions
    if (this.isEditMode && this.quizId) {
      this.quizzesService.updateQuiz(this.quizId, payload as any).subscribe({
        next: () => {
          this.isLoading = false;
          this.toast.success('Quiz mis à jour avec succès !');
          this.router.navigate(['/admin/quizlist']);
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Erreur lors de la mise à jour du quiz:', err);
          this.toast.error('Erreur lors de la mise à jour du quiz. Veuillez réessayer.');
        }
      });
      return;
    }

    // Mode création : on crée le quiz puis les questions
    this.quizzesService.createQuiz(payload as any).subscribe({
      next: (res) => {
        const quizId = (res as any)?.id;
        if (!quizId) {
          this.isLoading = false;
          this.toast.warning('Quiz créé mais identifiant introuvable pour créer les questions.');
          this.router.navigate(['/admin/quizlist']);
          return;
        }

        // Construire les payloads Questions pour POST /api/questions
        const questionRequests: CreateQuestionRequest[] = this.quiz.questions.map(q => {
          const apiType = this.mapFrontTypeToApi(q.type);

          if (apiType === 'APPARIEMENT') {
            const reponses = (q.pairesAppariement || []).map(p => ({ libelle: `${p.elementGauche} - ${p.elementDroit}`, estCorrecte: true }));
            return { quizId, enonce: q.question, points: q.points || 1, type: apiType, reponses };
          }

          if (apiType === 'VRAI_FAUX') {
            const reponses = [
              { libelle: 'VRAI', estCorrecte: q.reponses?.find(r => r.texte.toUpperCase() === 'VRAI')?.correcte === true },
              { libelle: 'FAUX', estCorrecte: q.reponses?.find(r => r.texte.toUpperCase() === 'FAUX')?.correcte === true }
            ];
            return { quizId, enonce: q.question, points: q.points || 1, type: apiType, reponses };
          }

          const reponses = (q.reponses || []).map(r => ({ libelle: r.texte, estCorrecte: !!r.correcte }));
          return { quizId, enonce: q.question, points: q.points || 1, type: apiType, reponses };
        });

        // Appeler le POST pour chaque question
        forkJoin(questionRequests.map(req => this.questionsService.createQuestion(req))).subscribe({
          next: () => {
            this.isLoading = false;
            this.toast.success('Quiz et questions créés avec succès !');
            this.router.navigate(['/admin/quizlist']);
          },
          error: (err) => {
            this.isLoading = false;
            console.error('Erreur lors de la création des questions:', err);
            this.toast.error('Quiz créé mais erreur lors de la création des questions');
            this.router.navigate(['/admin/quizlist']);
          }
        });
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Erreur lors de la cration du quiz:', err);
        this.toast.error('Erreur lors de la cration du quiz. Veuillez ressayer.');
      }
    });
  }
}