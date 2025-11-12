import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { QuizzesService } from '../../../../api/api/quizzes.service';
import { Quiz as ApiQuiz } from '../../../../api/model/quiz';

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
    { value: 'choix_multiple', icon: '📝', label: 'Choix multiple' },
    { value: 'multi_reponse', icon: '✅', label: 'Multi-réponse' },
    { value: 'vrai_faux', icon: '✔️', label: 'Vrai / Faux' },
    { value: 'reponse_courte', icon: '✍️', label: 'Réponse courte' },
    { value: 'reponse_longue', icon: '🧾', label: 'Réponse longue' },
    { value: 'appariement', icon: '🔗', label: 'Appariement' },
    { value: 'ordre', icon: '🔢', label: 'Ordre' }
  ];

  niveauxDifficulte = [
    { value: 'facile', label: 'Facile' },
    { value: 'moyen', label: 'Moyen' },
    { value: 'difficile', label: 'Difficile' }
  ];

  isLoading = false;

  constructor(
    private quizzesService: QuizzesService,
    private router: Router
  ) {}

  onRetour() {
    history.back();
  }

  onAnnuler() {
    if (confirm('Voulez-vous vraiment annuler ? Toutes les modifications seront perdues.')) {
      this.resetQuiz();
    }
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
    if (!this.quiz.livreAssocie || this.quiz.livreAssocie.trim() === '') return false;
    if (!this.quiz.questions || this.quiz.questions.length === 0) return false;
    
    // Validation des questions
    return this.quiz.questions.every(q => {
      if (!q.question || q.question.trim() === '') return false;
      if (!q.points || q.points < 1) return false;
      
      // Validation selon le type de question
      switch (q.type) {
        case 'choix_multiple':
        case 'multi_reponse':
        case 'vrai_faux':
        case 'ordre':
          return q.reponses && q.reponses.length >= 2 && 
                 q.reponses.some(r => r.correcte) &&
                 q.reponses.every(r => r.texte.trim() !== '');
        
        case 'reponse_courte':
        case 'reponse_longue':
          return q.bonneReponse && q.bonneReponse.trim() !== '';
        
        case 'appariement':
          return q.pairesAppariement && q.pairesAppariement.length >= 2 &&
                 q.pairesAppariement.every(p => 
                   p.elementGauche.trim() !== '' && p.elementDroit.trim() !== ''
                 );
        
        default:
          return true;
      }
    });
  }

  // Enregistrement du quiz
  onEnregistrerQuiz() {
    if (!this.estFormulaireValide()) {
      alert('Veuillez remplir tous les champs obligatoires et vérifier que chaque question est correctement configurée.');
      return;
    }

    this.isLoading = true;

    // Transformation des données pour l'API
    const payload = {
      titre: this.quiz.titre,
      description: this.quiz.description,
      duree: this.quiz.duree,
      difficulte: this.quiz.difficulte,
      livreAssocie: this.quiz.livreAssocie,
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

    this.quizzesService.createQuiz(payload).subscribe({
      next: (res) => {
        this.isLoading = false;
        console.log('Quiz créé avec succès:', res);
        alert('Quiz créé avec succès !');
        this.router.navigate(['/admin/quizlist']);
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Erreur lors de la création du quiz:', err);
        alert('Erreur lors de la création du quiz. Veuillez réessayer.');
      }
    });
  }
}