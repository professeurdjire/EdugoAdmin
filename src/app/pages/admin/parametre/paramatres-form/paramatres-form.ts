import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../services/api/auth.service';

@Component({
  selector: 'app-paramatres-form',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './paramatres-form.html',
  styleUrls: ['./paramatres-form.css']
})
export class ParamatresForm implements OnInit {
  error: string | null = null;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    // Check if user is authenticated
    if (!this.authService.isLoggedIn()) {
      this.error = "Vous devez vous connecter pour accéder à cette page.";
      return;
    }
  }
}
