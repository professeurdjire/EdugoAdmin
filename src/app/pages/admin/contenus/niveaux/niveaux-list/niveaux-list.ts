import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
// use the OpenAPI Generator client instead of handwritten service
import { NiveauxService } from '../../../../../../app/api';
import { NiveauResponse } from '../../../../../../app/api/model/niveauResponse';

@Component({
  selector: 'app-niveaux-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './niveaux-list.html',
  styleUrls: ['./niveaux-list.css'],
})
export class NiveauxList implements OnInit {
  niveaux: NiveauResponse[] = [];
  loading = false;

  constructor(private niveauxService: NiveauxService, private router: Router) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    // use generated client's getAllNiveaux()
    this.niveauxService.getAllNiveaux().subscribe({
      next: data => { this.niveaux = data || []; this.loading = false; },
      error: () => { this.niveaux = []; this.loading = false; }
    });
  }

  goToAdd(): void {
    this.router.navigate(['/admin/niveaux/ajouter']);
  }

  edit(n: NiveauResponse): void {
    if (!n.id) return;
    this.router.navigate(['/admin/niveaux/editer', n.id]);
  }

  delete(n: NiveauResponse): void {
    if (!n.id) return;
    if (!confirm(`Supprimer le niveau "${n.nom}" ?`)) return;
    this.niveauxService.deleteNiveau(n.id).subscribe({ next: () => this.load() });
  }
}
