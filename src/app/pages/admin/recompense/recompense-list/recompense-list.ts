import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface RewardItem {
  id: number;
  title: string;
  description: string;
  points: number;
  status: 'Actif' | 'Inactif';
  type: 'gold' | 'silver' | 'bronze' | 'gold2';
}

@Component({
  selector: 'app-recompense-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './recompense-list.html',
  styleUrls: ['./recompense-list.css']
})
export class RecompenseList implements OnInit {
  rewards: RewardItem[] = [];

  ngOnInit(): void {
    // generate sample rewards to populate the grid and match the visual design
    for (let i = 1; i <= 16; i++) {
      const type: RewardItem['type'] = i % 4 === 0 ? 'silver' : i % 4 === 3 ? 'bronze' : i % 4 === 2 ? 'gold2' : 'gold';
      this.rewards.push({
        id: i,
        title: 'Légende Vivante',
        description: 'Terminez les quiz avec un score de 95%',
        points: Math.floor(20 + Math.random() * 5000),
        status: i % 3 === 0 ? 'Inactif' : 'Actif',
        type
      });
    }
  }
}
