import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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

interface Quiz {
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
  imports: [CommonModule, FormsModule],
  templateUrl: './quiz-form.html',
  styleUrls: ['./quiz-form.css']
})
export class QuizForm {
  // Données du formulaire (initialisées avec propriétés attendues)
  quiz: Quiz = {
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

  // Types de questions disponibles (objet pour template)
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

  // --- Navigation / actions ---
  onRetour() {
    // prefer Location.back() in real app; kept simple here
    history.back();
  }

  onAnnuler() {
    this.resetQuiz();
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

  // --- Questions management ---
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

  // Type change handler (template calls with index)
  onTypeQuestionChange(index: number) {
    // ensure type value exists; template binds question.type via ngModel
    const q = this.quiz.questions[index];
    if (!q.type) q.type = 'choix_multiple';
    // initialize structures depending on type
    if (q.type === 'appariement' && !q.pairesAppariement) {
      q.pairesAppariement = [
        { elementGauche: '', elementDroit: '' },
        { elementGauche: '', elementDroit: '' }
      ];
    }
  }

  // --- Réponses management ---
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
      // toggle
      q.reponses[reponseIndex].correcte = !q.reponses[reponseIndex].correcte;
    } else {
      // single choice — ensure only one correct
      q.reponses.forEach((r, i) => (r.correcte = i === reponseIndex));
    }
  }

  // --- Appariement ---
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

  // --- Helpers / validation ---
  totalPoints(): number {
    return this.quiz.questions.reduce((acc, q) => acc + (q.points || 0), 0);
  }

  getDescriptionType(type: string) {
    const t = this.typesQuestions.find(x => x.value === type);
    return t ? t.label : '';
  }

  estFormulaireValide(): boolean {
    if (!this.quiz.titre || this.quiz.titre.trim() === '') return false;
    if (!this.quiz.questions || this.quiz.questions.length === 0) return false;
    // simple validation: every question must have text
    return this.quiz.questions.every(q => q.question && q.question.trim().length > 0);
  }

  onEnregistrerQuiz() {
    if (!this.estFormulaireValide()) return;
    console.log('Quiz enregistré:', this.quiz);
    // TODO: call API to save
  }
}
