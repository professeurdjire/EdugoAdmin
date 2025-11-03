
import {CommonModule} from '@angular/common';

import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';

interface QuizItem {
  title: string;
  level: string;
  subject: string;
  status: string;
}

@Component({
  selector: 'app-quiz-details',
  standalone:true,
  imports: [CommonModule, RouterLink],
  templateUrl: './quiz-details.html',
  styleUrls: ['./quiz-details.css'],
})
export class QuizDetails implements OnInit {
  // Data exposed to the template (matches template variable `quizzes`)
  quizzes: QuizItem[] = [];

  ngOnInit() {
    this.quizzes = this.generateQuizData(10);
  }

  generateQuizData(count: number): QuizItem[] {
    const data: QuizItem[] = [];
    for (let i = 0; i < count; i++) {
      data.push({
        title: 'Mathématiques 4 ème',
        level: '4 ème',
        subject: 'Mathématiques',
        status: 'Actif',
      });
    }
    return data;
  }
}
