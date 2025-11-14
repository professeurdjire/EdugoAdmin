import { Component } from '@angular/core';
import { ToastService } from '../../../shared/ui/toast/toast.service';
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

  constructor(private router: Router, private toast: ToastService) {}

  goBack(): void {
    window.history.back();
  }

  goHome(): void {
    this.router.navigate(['/admin/dashboard']);
  }

  contactSupport(): void {
    this.toast.info('Veuillez contacter le support à support@edugo.ml');
  }

  onSearch(): void {
    if (this.searchQuery.trim()) {
      this.toast.info(`Recherche pour: ${this.searchQuery}`);
      this.searchQuery = '';
    }
  }
}