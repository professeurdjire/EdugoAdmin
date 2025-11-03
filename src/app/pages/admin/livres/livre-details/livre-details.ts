import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-livre-details',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './livre-details.html',
  styleUrls: ['./livre-details.css']
})
export class LivreDetails {}
