import { Component, OnInit } from '@angular/core';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {Router, RouterLink, RouterModule} from '@angular/router';
import {CommonModule} from '@angular/common'; // Pour simuler la navigation

@Component({
  selector: 'app-login',
  templateUrl: './login.html',
  standalone: true,
  imports: [
    CommonModule,        // ✅ indispensable
    FormsModule,         // si tu utilises [(ngModel)]
    ReactiveFormsModule,
    RouterLink,
    // si tu utilises formGroup, formControlName

  ],
  styleUrls: ['./login.css'] // Utilisation de CSS standard
})
export class Login  {

}
