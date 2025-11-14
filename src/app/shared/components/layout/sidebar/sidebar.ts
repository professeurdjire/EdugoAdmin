import { Component } from '@angular/core';
import {CommonModule, NgIf} from '@angular/common';
import {RouterLink, RouterLinkActive, Router} from '@angular/router';
import { AuthService } from '../../../../services/api/auth.service';
import { SidebarStateService } from './sidebar-state.service';
import { ConfirmService } from '../../../ui/confirm/confirm.service';
import { ToastService } from '../../../ui/toast/toast.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.css']
})
export class Sidebar {
  isCollapsed = false; // état du sidebar

  constructor(
    private auth: AuthService,
    private router: Router,
    private sidebarState: SidebarStateService,
    private confirm: ConfirmService,
    private toast: ToastService
  ) {
    this.sidebarState.collapsed$.subscribe(v => (this.isCollapsed = v));
  }

  logout() {
    this.confirm
      .confirm({
        title: 'Déconnexion',
        message: 'Voulez-vous vraiment vous déconnecter ?',
        confirmText: 'Se déconnecter',
        cancelText: 'Annuler'
      })
      .then((ok) => {
        if (ok) {
          this.auth.logout();
          this.toast.info('Vous avez été déconnecté.');
        }
      });
  }
}


