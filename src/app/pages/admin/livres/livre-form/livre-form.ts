import { Component, ViewChild, ElementRef } from '@angular/core';

@Component({
  selector: 'app-livre-form',
  standalone:true,
  imports: [],
  templateUrl: './livre-form.html',
  styleUrl: './livre-form.css'
})
export class LivreForm {
  @ViewChild('fileInput') fileInput!: ElementRef;
  @ViewChild('imageInput') imageInput!: ElementRef;

  livre = {
    titre: '',
    auteur: '',
    isbn: '',
    editeur: '',
    description: '',
    matiere: '',
    niveau: '',
    langue: 'francais',
    fichierPrincipal: null as File | null,
    imageCouverture: null as File | null,
    lectureAuto: false,
    interactif: false,
    telechargementHorsLigne: false,
    motsCles: '',
    anneePublication: 'moyen'
  };

  onRetour() {
    console.log('Retour vers la page précédente');
    // this.router.navigate(['/admin/livres']);
  }

  onAnnuler() {
    if (confirm('Voulez-vous vraiment annuler ? Toutes les modifications seront perdues.')) {
      this.livre = {
        titre: '',
        auteur: '',
        isbn: '',
        editeur: '',
        description: '',
        matiere: '',
        niveau: '',
        langue: 'francais',
        fichierPrincipal: null,
        imageCouverture: null,
        lectureAuto: false,
        interactif: false,
        telechargementHorsLigne: false,
        motsCles: '',
        anneePublication: 'moyen'
      };
    }
  }

  onSubmit() {
    console.log('Soumission du formulaire:', this.livre);
    // Logique de sauvegarde ici
  }

  onFileSelected(event: any, type: 'file' | 'image') {
    const file = event.target.files[0];
    if (file) {
      if (type === 'file') {
        this.livre.fichierPrincipal = file;
        console.log('Fichier sélectionné:', file.name);
      } else {
        this.livre.imageCouverture = file;
        console.log('Image sélectionnée:', file.name);
      }
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent, type: 'file' | 'image') {
    event.preventDefault();
    event.stopPropagation();

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (type === 'file') {
        this.livre.fichierPrincipal = file;
        console.log('Fichier déposé:', file.name);
      } else {
        this.livre.imageCouverture = file;
        console.log('Image déposée:', file.name);
      }
    }
  }
}

