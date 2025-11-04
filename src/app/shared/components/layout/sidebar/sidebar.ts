import { Component } from '@angular/core';
import {CommonModule, NgIf} from '@angular/common';
import {RouterLink, RouterLinkActive, Router} from '@angular/router';
import { AuthService } from '../../../../services/api/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.css']
})
export class Sidebar {
  isCollapsed = false; // état du sidebar

  constructor(private auth: AuthService, private router: Router) {}

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
  }

  logout() {
    const confirmed = window.confirm('Voulez-vous vraiment vous déconnecter ?');
    if (confirmed) {
      this.auth.logout();
    }
  }
}


