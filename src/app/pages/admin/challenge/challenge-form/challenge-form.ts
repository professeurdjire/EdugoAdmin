import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Location } from '@angular/common';

@Component({
  selector: 'app-challenge-form',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './challenge-form.html',
  styleUrls: ['./challenge-form.css']
})
export class ChallengeForm {
  constructor(private location: Location) {}

  onRetour() {
    this.location.back();
  }

  onAnnuler() {
    if (confirm('Voulez-vous vraiment annuler ? Toutes les modifications seront perdues.')) {
      this.location.back();
    }
  }
}
