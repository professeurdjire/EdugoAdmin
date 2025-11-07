import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './not-found.html',
  styleUrls: ['./not-found.css']
})
export class NotFound {
  searchQuery: string = '';

  constructor(private router: Router) {}

  goBack(): void {
    window.history.back();
  }

  goHome(): void {
    this.router.navigate(['/admin/dashboard']);
  }

  contactSupport(): void {
    // In a real application, this would open a contact form or email client
    alert('Veuillez contacter le support à support@edugo.ml');
  }

  onSearch(): void {
    if (this.searchQuery.trim()) {
      // In a real application, this would perform a search
      alert(`Recherche pour: ${this.searchQuery}`);
      this.searchQuery = '';
    }
  }
}