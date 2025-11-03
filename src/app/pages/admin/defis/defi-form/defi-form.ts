import { Component, OnInit } from '@angular/core';
import {FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-defi-form',
  standalone:true,
  imports: [
    CommonModule, ReactiveFormsModule
  ],
  templateUrl: './defi-form.html',
  styleUrls: ['./defi-form.css'],
})
export class DefiForm implements OnInit {
  defiForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {
    this.defiForm = this.createForm();
  }

  ngOnInit(): void {}

  // Getter pour accéder facilement au FormArray des questions
  get questions(): FormArray {
    return this.defiForm.get('questions') as FormArray;
  }

  // Création du formulaire réactif
  createForm(): FormGroup {
    return this.fb.group({
      // Informations de base
      classeConcernee: ['', [Validators.required]],
      titre: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      typeDefis: [''],
      dateAjout: ['', [Validators.required]],

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

  // Soumission du formulaire
  onSubmit(): void {
    if (this.defiForm.valid) {
      const formData = this.defiForm.value;
      console.log('Défi à enregistrer:', formData);

      // Simulation d'enregistrement
      this.enregistrerDefi(formData);
    } else {
      this.marquerChampsCommeTouches();
    }
  }

  // Annulation
  onAnnuler(): void {
    if (confirm('Voulez-vous vraiment annuler ? Toutes les modifications seront perdues.')) {
      this.defiForm.reset();
      this.router.navigate(['/admin/defiList']);
    }
  }

  // Marquer tous les champs comme "touched" pour afficher les erreurs
  private marquerChampsCommeTouches(): void {
    Object.keys(this.defiForm.controls).forEach(key => {
      const control = this.defiForm.get(key);
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
  private enregistrerDefi(defi: any): void {
    // Ici, vous intégreriez votre service d'API
    console.log('Enregistrement du défi:', defi);

    // Simulation de succès
    setTimeout(() => {
      alert('Défi enregistré avec succès !');
      this.router.navigate(['/admin/defiList']);
    }, 1000);
  }

  // Méthodes utilitaires pour le template
  estChampInvalide(nomChamp: string): boolean {
    const control = this.defiForm.get(nomChamp);
    return !!control && control.invalid && control.touched;
  }

  estQuestionInvalide(index: number, nomChamp: string): boolean {
    const question = this.questions.at(index) as FormGroup;
    const control = question.get(nomChamp);
    return !!control && control.invalid && control.touched;
  }

  // Getters pour les messages d'erreur
  getErrorMessage(nomChamp: string): string {
    const control = this.defiForm.get(nomChamp);
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
