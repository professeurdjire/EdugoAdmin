import { Component, OnInit } from '@angular/core';
import {CommonModule} from '@angular/common';
import { RouterLink } from '@angular/router';

interface ExerciceItem {
  titre: string;
  niveau: string;
  matiere: string;
  date: string;
}

@Component({
  selector: 'app-exercice-details',
  standalone:true,
  imports: [CommonModule, RouterLink],
  templateUrl: './exercice-details.html',
  styleUrls: ['./exercice-details.css']
})
export class ExerciceDetails implements OnInit {
  exercices: ExerciceItem[] = [];

  ngOnInit(): void {
    this.exercices = this.generateExercices(10);
  }

  private generateExercices(count: number): ExerciceItem[] {
    const items: ExerciceItem[] = [];
    for (let i = 0; i < count; i++) {
      items.push({
        titre: `Exercice ${i + 1} - Fractions`,
        niveau: '4 ème',
        matiere: 'Mathématiques',
        date: '10/10/2025',
      });
    }
    return items;
  }
}
