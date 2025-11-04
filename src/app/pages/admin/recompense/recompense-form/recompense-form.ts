import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Location } from '@angular/common';

@Component({
  selector: 'app-recompense-form',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './recompense-form.html',
  styleUrls: ['./recompense-form.css']
})
export class RecompenseForm {
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
