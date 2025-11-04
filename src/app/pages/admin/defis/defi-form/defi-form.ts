import { Component, OnInit } from '@angular/core';
import {FormBuilder, FormGroup, FormArray, Validators, FormControl, ReactiveFormsModule} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-defi-form',
  standalone:true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './defi-form.html',
  styleUrls: ['./defi-form.css'],
})
export class DefiForm implements OnInit {
  defiForm: FormGroup;

  typesQuestions = [
    { value: 'choix_multiple', label: 'Choix multiple', icon: '📝' },
    { value: 'multi_reponse', label: 'Multi-réponse', icon: '✅' },
    { value: 'vrai_faux', label: 'Vrai / Faux', icon: '✔️' },
    { value: 'reponse_courte', label: 'Réponse courte', icon: '✍️' },
    { value: 'reponse_longue', label: 'Réponse longue', icon: '🧾' },
    { value: 'appariement', label: 'Appariement', icon: '🔗' },
    { value: 'ordre', label: 'Ordre', icon: '🔢' }
  ];

  niveauxDifficulte = [
    { value: 'facile', label: 'Facile' },
    { value: 'moyen', label: 'Moyen' },
    { value: 'difficile', label: 'Difficile' }
  ];

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
      questions: this.fb.array([this.createQuestionGroup(1)])
    });
  }

  // Create a question group with dynamic reponses array
  createQuestionGroup(numero: number) {
    return this.fb.group({
      numero: [numero],
      typeQuestion: ['choix_multiple', [Validators.required]],
      question: ['', [Validators.required, Validators.minLength(5)]],
      points: [1],
      reponses: this.fb.array(this.defaultReponses()),
      pairesAppariement: this.fb.array([]),
      bonneReponse: ['']
    });
  }

  defaultReponses() {
    // default 4 answers A-D
    const letters = ['A','B','C','D'];
    return letters.map(l => this.fb.group({ lettre: [l], texte: [''], correcte: [false] }));
  }

  // Ajouter une nouvelle question
  ajouterQuestion(): void {
    const nouveauNumero = this.questions.length + 1;
    this.questions.push(this.createQuestionGroup(nouveauNumero));
  }

  // Dupliquer
  dupliquerQuestion(index: number) {
    const q = this.questions.at(index).value;
    const copie = JSON.parse(JSON.stringify(q));
    copie.numero = this.questions.length + 1;
    this.questions.insert(index + 1, this.fb.group(copie));
    this.renumeroterQuestions();
  }

  // Déplacer
  deplacerQuestion(index: number, direction: 'up' | 'down') {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= this.questions.length) return;
    const from = this.questions.at(index);
    const to = this.questions.at(target);
    const temp = from.value;
    from.setValue(to.value);
    to.setValue(temp);
    this.renumeroterQuestions();
  }

  renumeroterQuestions() {
    this.questions.controls.forEach((c, i) => c.get('numero')?.setValue(i + 1));
  }

  // Supprimer une question
  supprimerQuestion(index: number): void {
    if (this.questions.length > 1) {
      this.questions.removeAt(index);
      this.renumeroterQuestions();
    }
  }

  // Réponses management
  getReponses(questionIndex: number): FormArray {
    return this.questions.at(questionIndex).get('reponses') as FormArray;
  }

  getPaires(questionIndex: number): FormArray {
    return this.questions.at(questionIndex).get('pairesAppariement') as FormArray;
  }

  ajouterReponse(questionIndex: number) {
    const reponses = this.getReponses(questionIndex);
    const lettre = String.fromCharCode(65 + reponses.length);
    reponses.push(this.fb.group({ lettre: [lettre], texte: [''], correcte: [false] }));
  }

  supprimerReponse(questionIndex: number, reponseIndex: number) {
    const reponses = this.getReponses(questionIndex);
    if (reponses.length <= 2) return;
    reponses.removeAt(reponseIndex);
  }

  onReponseCorrecteChange(questionIndex: number, reponseIndex: number, type: string) {
    const reponses = this.getReponses(questionIndex);
    if (type === 'multi_reponse' || type === 'case_a_cocher') {
      const ctrl = reponses.at(reponseIndex);
      ctrl.get('correcte')?.setValue(!ctrl.get('correcte')?.value);
    } else {
      // single choice: only one true
      reponses.controls.forEach((r, i) => r.get('correcte')?.setValue(i === reponseIndex));
    }
  }

  // Appariement
  ajouterPaireAppariement(questionIndex: number) {
    const paires = this.questions.at(questionIndex).get('pairesAppariement') as FormArray;
    paires.push(this.fb.group({ elementGauche: [''], elementDroit: [''] }));
  }

  supprimerPaireAppariement(questionIndex: number, paireIndex: number) {
    const paires = this.questions.at(questionIndex).get('pairesAppariement') as FormArray;
    if (paires.length <= 2) return;
    paires.removeAt(paireIndex);
  }

  // Soumission du formulaire
  onSubmit(): void {
    if (this.defiForm.valid) {
      const formData = this.defiForm.value;
      console.log('Défi à enregistrer:', formData);
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
            const nested = questionControl.get(subKey);
            if (nested instanceof FormArray) {
              nested.controls.forEach((c: any) => c.markAsTouched && c.markAsTouched());
            }
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

  // Helpers
  totalPoints(): number {
    return this.questions.controls.reduce((acc, q: any) => acc + (q.get('points')?.value || 0), 0);
  }

  estFormulaireValide(): boolean {
    return this.defiForm.valid;
  }
}
