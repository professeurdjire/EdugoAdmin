import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import {FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule} from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-exercice-form',
  standalone: true,
  imports: [
    ReactiveFormsModule
  ],
  templateUrl: './exercice-form.html',
  styleUrl: './exercice-form.css'
})
export class ExerciceForm implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef;
  @ViewChild('imageInput') imageInput!: ElementRef;

  exerciceForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {
    this.exerciceForm = this.createForm();
  }

  ngOnInit(): void {}

  // Getter pour accéder facilement au FormArray des questions
  get questions(): FormArray {
    return this.exerciceForm.get('questions') as FormArray;
  }

  // Création du formulaire réactif
  createForm(): FormGroup {
    return this.fb.group({
      // Informations de base
      matiereConcernee: ['', [Validators.required]],
      titre: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      dateAjout: ['', [Validators.required]],

      // Fichiers
      fichierPrincipal: [null],
      imageExercice: [null],

      // Questions (FormArray)
      questions: this.fb.array([this.createQuestion()])
    });
  }

  // Création d'une question
  createQuestion(): FormGroup {
    return this.fb.group({
      typeQuestion: ['', [Validators.required]],
      question: ['', [Validators.required, Validators.minLength(5)]],
      reponseA: [''],
      reponseB: [''],
      reponseC: [''],
      reponseD: [''],
      bonneReponse: ['', [Validators.required]]
    });
  }

  // Ajouter une nouvelle question
  ajouterQuestion(): void {
    this.questions.push(this.createQuestion());
  }

  // Supprimer une question
  supprimerQuestion(index: number): void {
    if (this.questions.length > 1) {
      this.questions.removeAt(index);
    }
  }

  // Gestion des fichiers
  onFileSelected(event: any, type: 'fichier' | 'image'): void {
    const file = event.target.files[0];
    if (file) {
      if (type === 'fichier') {
        this.exerciceForm.patchValue({ fichierPrincipal: file });
        console.log('Fichier sélectionné:', file.name);
      } else {
        this.exerciceForm.patchValue({ imageExercice: file });
        console.log('Image sélectionnée:', file.name);
      }
    }
  }

  // Drag and drop
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent, type: 'fichier' | 'image'): void {
    event.preventDefault();
    event.stopPropagation();

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (type === 'fichier') {
        this.exerciceForm.patchValue({ fichierPrincipal: file });
        console.log('Fichier déposé:', file.name);
      } else {
        this.exerciceForm.patchValue({ imageExercice: file });
        console.log('Image déposée:', file.name);
      }
    }
  }

  // Soumission du formulaire
  onSubmit(): void {
    if (this.exerciceForm.valid) {
      const formData = this.exerciceForm.value;
      console.log('Exercice à enregistrer:', formData);

      // Simulation d'enregistrement
      this.enregistrerExercice(formData);
    } else {
      this.marquerChampsCommeTouches();
    }
  }

  // Annulation
  onAnnuler(): void {
    if (confirm('Voulez-vous vraiment annuler ? Toutes les modifications seront perdues.')) {
      this.exerciceForm.reset();
      this.router.navigate(['/admin/exercices']);
    }
  }

  // Marquer tous les champs comme "touched" pour afficher les erreurs
  private marquerChampsCommeTouches(): void {
    Object.keys(this.exerciceForm.controls).forEach(key => {
      const control = this.exerciceForm.get(key);
      if (control instanceof FormGroup) {
        Object.keys(control.controls).forEach(subKey => {
          control.get(subKey)?.markAsTouched();
        });
      } else if (control instanceof FormArray) {
        // @ts-ignore
        control.controls.forEach((questionControl: FormGroup) => {
          Object.keys(questionControl.controls).forEach(subKey => {
            questionControl.get(subKey)?.markAsTouched();
          });
        });
      } else {
        control?.markAsTouched();
      }
    });
  }

  // Simulation d'enregistrement
  private enregistrerExercice(exercice: any): void {
    // Ici, vous intégreriez votre service d'API
    console.log('Enregistrement de l\'exercice:', exercice);

    // Simulation de succès
    setTimeout(() => {
      alert('Exercice enregistré avec succès !');
      this.router.navigate(['/admin/exercices']);
    }, 1000);
  }

  // Méthodes utilitaires pour le template
  estChampInvalide(nomChamp: string): boolean {
    const control = this.exerciceForm.get(nomChamp);
    return !!control && control.invalid && control.touched;
  }

  estQuestionInvalide(index: number, nomChamp: string): boolean {
    const question = this.questions.at(index) as FormGroup;
    const control = question.get(nomChamp);
    return !!control && control.invalid && control.touched;
  }

  // Getters pour les messages d'erreur
  getErrorMessage(nomChamp: string): string {
    const control = this.exerciceForm.get(nomChamp);
    if (control?.errors?.['required']) {
      return 'Ce champ est obligatoire';
    }
    if (control?.errors?.['minlength']) {
      return `Minimum ${control.errors?.['minlength'].requiredLength} caractères`;
    }
    return '';
  }

  getQuestionErrorMessage(index: number, nomChamp: string): string {
    const question = this.questions.at(index) as FormGroup;
    const control = question.get(nomChamp);
    if (control?.errors?.['required']) {
      return 'Ce champ est obligatoire';
    }
    if (control?.errors?.['minlength']) {
      return `Minimum ${control.errors?.['minlength'].requiredLength} caractères`;
    }
    return '';
  }
}
