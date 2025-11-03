import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

interface Question {
  id: number;
  numero: number;
  type: string;
  question: string;
  points: number;
  reponses: Reponse[];
  bonneReponse: string | string[];
  pairesAppariement?: PaireAppariement[];
  reponseCourte?: string;
  reponseLongue?: string;
}

interface Reponse {
  lettre: string;
  texte: string;
  correcte: boolean;
}

interface PaireAppariement {
  id: number;
  elementGauche: string;
  elementDroit: string;
}

@Component({
  selector: 'app-quiz-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './quiz-form.html',
  styleUrls: ['./quiz-form.css']
})
export class QuizForm {
  // Données du formulaire
  quiz = {
    livreAssocie: '',
    titre: '',
    description: '',
    duree: 30,
    difficulte: 'moyen',
    questions: [] as Question[]
  };

  // Types de questions disponibles avec leurs configurations
  typesQuestions = [
    { 
      value: 'choix_multiple', 
      label: 'Question à choix multiples',
      description: 'Plusieurs choix, une seule bonne réponse',
      icon: '🔘'
    },
    { 
      value: 'multi_reponse', 
      label: 'Question à réponses multiples',
      description: 'Plusieurs choix, plusieurs bonnes réponses possibles',
      icon: '☑️'
    },
    { 
      value: 'vrai_faux', 
      label: 'Question vrai/faux',
      description: 'L\'utilisateur doit choisir entre vrai ou faux',
      icon: '⚖️'
    },
    { 
      value: 'reponse_courte', 
      label: 'Question à réponse courte',
      description: 'Réponse texte courte (quelques mots)',
      icon: '📝'
    },
    { 
      value: 'reponse_longue', 
      label: 'Question à réponse longue',
      description: 'Réponse texte développée',
      icon: '📄'
    },
    { 
      value: 'appariement', 
      label: 'Question d\'appariement',
      description: 'Associer des éléments de deux colonnes',
      icon: '🔗'
    },
    { 
      value: 'ordre', 
      label: 'Mise en ordre',
      description: 'Remettre les éléments dans le bon ordre',
      icon: '🔢'
    },
    { 
      value: 'case_a_cocher', 
      label: 'Case à cocher',
      description: 'Cocher les bonnes réponses',
      icon: '✅'
    }
  ];

  // Niveaux de difficulté
  niveauxDifficulte = [
    { value: 'facile', label: 'Facile' },
    { value: 'moyen', label: 'Moyen' },
    { value: 'difficile', label: 'Difficile' }
  ];

  // Lettres pour les réponses
  lettresReponses = ['A', 'B', 'C', 'D', 'E', 'F'];

  constructor() {
    // Ajouter une question par défaut au chargement
    this.ajouterQuestion();
  }

  // Calculer le total des points du quiz (utilisé depuis le template)
  totalPoints(): number {
    return this.quiz.questions.reduce((total, q) => total + (q.points || 0), 0);
  }

  // Méthodes pour la gestion des questions

  ajouterQuestion() {
    const nouvelleQuestion: Question = {
      id: Date.now(),
      numero: this.quiz.questions.length + 1,
      type: 'choix_multiple',
      question: '',
      points: 1,
      reponses: this.lettresReponses.slice(0, 4).map(lettre => ({
        lettre,
        texte: '',
        correcte: false
      })),
      bonneReponse: '',
      pairesAppariement: [
        { id: 1, elementGauche: '', elementDroit: '' },
        { id: 2, elementGauche: '', elementDroit: '' },
        { id: 3, elementGauche: '', elementDroit: '' }
      ]
    };
    
    this.quiz.questions.push(nouvelleQuestion);
  }

  supprimerQuestion(index: number) {
    if (this.quiz.questions.length > 1) {
      this.quiz.questions.splice(index, 1);
      this.renumeroterQuestions();
    }
  }

  renumeroterQuestions() {
    this.quiz.questions.forEach((question, index) => {
      question.numero = index + 1;
    });
  }

  dupliquerQuestion(index: number) {
    const questionOriginale = this.quiz.questions[index];
    const questionDupliquee: Question = {
      ...JSON.parse(JSON.stringify(questionOriginale)),
      id: Date.now(),
      numero: this.quiz.questions.length + 1
    };
    this.quiz.questions.push(questionDupliquee);
  }

  // Méthodes pour la gestion des réponses

  ajouterReponse(questionIndex: number) {
    const question = this.quiz.questions[questionIndex];
    if (question.reponses.length < 6) {
      const nouvelleLettre = this.lettresReponses[question.reponses.length];
      question.reponses.push({
        lettre: nouvelleLettre,
        texte: '',
        correcte: false
      });
    }
  }

  supprimerReponse(questionIndex: number, reponseIndex: number) {
    const question = this.quiz.questions[questionIndex];
    if (question.reponses.length > 2) {
      question.reponses.splice(reponseIndex, 1);
      // Recalculer les lettres
      question.reponses.forEach((reponse, index) => {
        reponse.lettre = this.lettresReponses[index];
      });
    }
  }

  // Méthodes pour l'appariement

  ajouterPaireAppariement(questionIndex: number) {
    const question = this.quiz.questions[questionIndex];
    if (question.pairesAppariement && question.pairesAppariement.length < 6) {
      question.pairesAppariement.push({
        id: Date.now(),
        elementGauche: '',
        elementDroit: ''
      });
    }
  }

  supprimerPaireAppariement(questionIndex: number, paireIndex: number) {
    const question = this.quiz.questions[questionIndex];
    if (question.pairesAppariement && question.pairesAppariement.length > 2) {
      question.pairesAppariement.splice(paireIndex, 1);
    }
  }

  // Gestion des changements de type

  onTypeQuestionChange(questionIndex: number) {
    const question = this.quiz.questions[questionIndex];
    
    // Réinitialiser les données selon le type
    switch (question.type) {
      case 'choix_multiple':
        question.reponses = this.lettresReponses.slice(0, 4).map(lettre => ({
          lettre,
          texte: '',
          correcte: false
        }));
        question.bonneReponse = '';
        break;
        
      case 'multi_reponse':
        question.reponses = this.lettresReponses.slice(0, 4).map(lettre => ({
          lettre,
          texte: '',
          correcte: false
        }));
        question.bonneReponse = [];
        break;
        
      case 'vrai_faux':
        question.reponses = [
          { lettre: 'V', texte: 'Vrai', correcte: false },
          { lettre: 'F', texte: 'Faux', correcte: false }
        ];
        question.bonneReponse = '';
        break;
        
      case 'appariement':
        question.pairesAppariement = [
          { id: 1, elementGauche: '', elementDroit: '' },
          { id: 2, elementGauche: '', elementDroit: '' },
          { id: 3, elementGauche: '', elementDroit: '' }
        ];
        break;
        
      case 'reponse_courte':
      case 'reponse_longue':
        question.reponses = [];
        question.bonneReponse = '';
        break;
        
      case 'ordre':
        question.reponses = this.lettresReponses.slice(0, 4).map(lettre => ({
          lettre,
          texte: '',
          correcte: false
        }));
        question.bonneReponse = [];
        break;
    }
  }

  // Gestion des réponses correctes

  onReponseCorrecteChange(questionIndex: number, reponseIndex: number, type: string) {
    const question = this.quiz.questions[questionIndex];
    const reponse = question.reponses[reponseIndex];
    
    if (type === 'choix_multiple' || type === 'vrai_faux') {
      // Une seule réponse correcte
      question.reponses.forEach(r => r.correcte = false);
      reponse.correcte = true;
      question.bonneReponse = reponse.lettre;
    } else if (type === 'multi_reponse' || type === 'case_a_cocher') {
      // Plusieurs réponses correctes
      reponse.correcte = !reponse.correcte;
      question.bonneReponse = question.reponses
        .filter(r => r.correcte)
        .map(r => r.lettre);
    }
  }

  // Validation

  estFormulaireValide(): boolean {
    if (!this.quiz.titre || !this.quiz.livreAssocie) {
      return false;
    }
    
    return this.quiz.questions.every(question => {
      if (!question.question || !question.type) return false;
      
      switch (question.type) {
        case 'choix_multiple':
        case 'vrai_faux':
          return question.bonneReponse !== '';
        case 'multi_reponse':
        case 'case_a_cocher':
          return Array.isArray(question.bonneReponse) && question.bonneReponse.length > 0;
        case 'reponse_courte':
        case 'reponse_longue':
          return question.bonneReponse !== '';
        case 'appariement':
          return question.pairesAppariement?.every(paire => 
            paire.elementGauche && paire.elementDroit
          ) || false;
        default:
          return true;
      }
    });
  }

  // Méthodes d'action

  onRetour() {
    console.log('Retour');
    // Navigation vers la page précédente
  }

  onAnnuler() {
    if (confirm('Êtes-vous sûr de vouloir annuler ? Toutes les modifications seront perdues.')) {
      this.quiz = {
        livreAssocie: '',
        titre: '',
        description: '',
        duree: 30,
        difficulte: 'moyen',
        questions: []
      };
      this.ajouterQuestion();
    }
  }

  onEnregistrerQuiz() {
    if (this.estFormulaireValide()) {
      console.log('Quiz enregistré:', this.quiz);
      // Logique d'enregistrement du quiz
      alert('Quiz enregistré avec succès !');
    } else {
      alert('Veuillez remplir tous les champs obligatoires et vérifier vos questions.');
    }
  }

  // Utilitaires

  getTypeQuestionLabel(typeValue: string): string {
    const type = this.typesQuestions.find(t => t.value === typeValue);
    return type ? type.label : 'Type inconnu';
  }

  getDescriptionType(typeValue: string): string {
    const type = this.typesQuestions.find(t => t.value === typeValue);
    return type ? type.description : '';
  }

  // Réorganisation des questions
  deplacerQuestion(index: number, direction: 'up' | 'down') {
    if ((direction === 'up' && index > 0) || 
        (direction === 'down' && index < this.quiz.questions.length - 1)) {
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      const [question] = this.quiz.questions.splice(index, 1);
      this.quiz.questions.splice(newIndex, 0, question);
      this.renumeroterQuestions();
    }
  }
}