import { Component } from '@angular/core';
import {CommonModule, NgIf} from '@angular/common';
import {RouterLink, Router} from '@angular/router';
import { AuthService } from '../../../../services/api/auth.service';
import { SidebarStateService } from './sidebar-state.service';
import { ConfirmService } from '../../../ui/confirm/confirm.service';
import { ToastService } from '../../../ui/toast/toast.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, CommonModule],
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

  isSectionActive(section: string): boolean {
    const url = this.router.url;

    switch (section) {
      case 'dashboard':
        return url.startsWith('/admin/dashboard');
      case 'utilisateurs':
        return url.startsWith('/admin/utilisateurs')
          || url.startsWith('/admin/ajouterUtilisateur')
          || url.startsWith('/admin/editerUtilisateur');
      case 'contenus':
        return url.startsWith('/admin/contenus');
      case 'livres':
        return url.startsWith('/admin/livrelist')
          || url.startsWith('/admin/ajouterlivre')
          || url.startsWith('/admin/livredetails')
          || url.startsWith('/admin/livreDetails');
      case 'quiz':
        return url.startsWith('/admin/quizlist')
          || url.startsWith('/admin/ajouterQuiz')
          || url.startsWith('/admin/quizdetails')
          || url.startsWith('/admin/quizDetails');
      case 'defis':
        return url.startsWith('/admin/defilist')
          || url.startsWith('/admin/ajouterdefi')
          || url.startsWith('/admin/defidetails')
          || url.startsWith('/admin/defiDetails');
      case 'challenges':
        return url.startsWith('/admin/challengelist')
          || url.startsWith('/admin/ajouterchallenge')
          || url.startsWith('/admin/challengedetails')
          || url.startsWith('/admin/challengeDetails');
      case 'exercices':
        return url.startsWith('/admin/exercicelist')
          || url.startsWith('/admin/ajouterexercice')
          || url.startsWith('/admin/exercicedetails')
          || url.startsWith('/admin/exerciceDetails');
      case 'recompenses':
        return url.startsWith('/admin/recompenselist')
          || url.startsWith('/admin/ajouterrecompense')
          || url.startsWith('/admin/editerrecompense');
      case 'partenaires':
        return url.startsWith('/admin/partenaire')
          || url.startsWith('/admin/ajouterpartenaire');
      case 'parametres':
        return url.startsWith('/admin/paramatresList')
          || url.startsWith('/admin/paramatresForm');
      default:
        return false;
    }
  }
}


