import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-quiz-form',
  standalone: true,
  imports: [],
  templateUrl: './quiz-form.html',
  styleUrl: './quiz-form.css'
})
export class QuizForm {
  // Données du formulaire
  quiz = {
    livreAssocie: '',
    titre: '',
    description: '',
    questions: [
      {
        numero: 1,
        type: '',
        question: '',
        reponses: [
          { lettre: 'A', texte: '' },
          { lettre: 'B', texte: '' },
          { lettre: 'C', texte: '' },
          { lettre: 'D', texte: '' }
        ],
        bonneReponse: ''
      }
    ]
  };

  // Types de questions disponibles
  typesQuestions = [
    'Question à choix multiples',
    'Question vrai/faux',
    'Question à réponse courte',
    'Question à réponse longue'
  ];

  // Méthodes pour les actions
  onRetour() {
    console.log('Retour');
    // Navigation vers la page précédente
  }

  onAnnuler() {
    console.log('Annuler');
    this.quiz = {
      livreAssocie: '',
      titre: '',
      description: '',
      questions: [
        {
          numero: 1,
          type: '',
          question: '',
          reponses: [
            { lettre: 'A', texte: '' },
            { lettre: 'B', texte: '' },
            { lettre: 'C', texte: '' },
            { lettre: 'D', texte: '' }
          ],
          bonneReponse: ''
        }
      ]
    };
  }

  onAjouterQuestion() {
    const nouveauNumero = this.quiz.questions.length + 1;
    this.quiz.questions.push({
      numero: nouveauNumero,
      type: '',
      question: '',
      reponses: [
        { lettre: 'A', texte: '' },
        { lettre: 'B', texte: '' },
        { lettre: 'C', texte: '' },
        { lettre: 'D', texte: '' }
      ],
      bonneReponse: ''
    });
    console.log('Nouvelle question ajoutée:', nouveauNumero);
  }

  onEnregistrerQuiz() {
    console.log('Quiz enregistré:', this.quiz);
    // Logique d'enregistrement du quiz
  }

  onTypeQuestionChange(type: string, index: number) {
    this.quiz.questions[index].type = type;
    console.log(`Type de question ${index + 1} changé:`, type);
  }

  onBonneReponseChange(reponse: string, index: number) {
    this.quiz.questions[index].bonneReponse = reponse;
    console.log(`Bonne réponse question ${index + 1}:`, reponse);
  }

  onReponseChange(lettre: string, texte: string, questionIndex: number) {
    const reponseIndex = this.quiz.questions[questionIndex].reponses.findIndex(r => r.lettre === lettre);
    if (reponseIndex !== -1) {
      this.quiz.questions[questionIndex].reponses[reponseIndex].texte = texte;
    }
  }

  onQuestionChange(texte: string, index: number) {
    this.quiz.questions[index].question = texte;
  }

  // Méthode pour supprimer une question
  supprimerQuestion(index: number) {
    if (this.quiz.questions.length > 1) {
      this.quiz.questions.splice(index, 1);
      // Recalculer les numéros
      this.quiz.questions.forEach((question, i) => {
        question.numero = i + 1;
      });
    }
  }
}
