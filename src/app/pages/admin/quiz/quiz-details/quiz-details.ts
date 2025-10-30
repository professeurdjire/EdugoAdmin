
import {CommonModule} from '@angular/common';


import { Component, OnInit } from '@angular/core';

interface QuizItem {
  utilisateur: string;
  titre: string;
  niveau: string;
  matieres: string;
  tentatives: number;
  points: number;
  statut: string;
}

@Component({
  selector: 'app-quiz-details',
  standalone:true,
  imports: [CommonModule],
  templateUrl: './quiz-details.html',
  styleUrls: ['./quiz-details.css'],
})
export class QuizDetails implements OnInit {
  pageTitle: string = "Listes des Quiz (2,847)";

  // Simulation des données de la table
  quizList: QuizItem[] = [];

  ngOnInit() {
    this.quizList = this.generateQuizData(10);
  }

  generateQuizData(count: number): QuizItem[] {
    const data: QuizItem[] = [];
    for (let i = 0; i < count; i++) {
      data.push({
        utilisateur: 'Par Dr. Issa Traoré',
        titre: 'Mathématiques 4 ème',
        niveau: '4 ème',
        matieres: 'Mathématiques',
        tentatives: 1780,
        points: 1280,
        statut: 'Actif',
      });
    }
    return data;
  }
}
