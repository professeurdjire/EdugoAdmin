import { Component, OnInit } from '@angular/core';
import {FormBuilder, FormGroup, FormArray, Validators, FormControl, ReactiveFormsModule} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { DefisService } from '../../../../services/api/admin/defis.service';
import { Defi } from '../../../../api/model/defi';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import { ConfirmService } from '../../../../shared/ui/confirm/confirm.service';
import { QuestionsService, CreateQuestionRequest } from '../../../../services/api/questions.service';
import { forkJoin } from 'rxjs';
import { ClassesService } from '../../../../services/api/admin/classes.service';
import { Classe } from '../../../../api/model/classe';

@Component({
  selector: 'app-defi-form',
  standalone:true,
  imports: [CommonModule, ReactiveFormsModule, FaIconComponent],
  templateUrl: './defi-form.html',
  styleUrls: ['./defi-form.css'],
})
export class DefiForm implements OnInit {
  faArrowLeft = faArrowLeft;
  defiForm: FormGroup;
  isLoading = false;
  loadingTypes = false;
  backendTypes: Array<{ id: number; libelle: string }> = [];
  classes: Classe[] = [];

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
    private router: Router,
    private defisService: DefisService,
    private toast: ToastService,
    private confirm: ConfirmService,
    private questionsService: QuestionsService,
    private classesService: ClassesService
  ) {
    this.defiForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadingTypes = true;
    this.questionsService.getTypes().subscribe({
      next: (types) => {
        this.backendTypes = types || [];
        this.loadingTypes = false;
      },
      error: () => {
        this.loadingTypes = false;
        this.toast.error('Impossible de charger les types de questions');
      }
    });

    // Charger les classes pour le select
    this.classesService.list().subscribe({
      next: (d) => (this.classes = d || []),
      error: () => this.toast.error('Impossible de charger les classes')
    });
  }

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
    if (this.defiForm.valid && this.validateQuestionsBySpec()) {
      const formData = this.defiForm.value;
      const payload: Partial<Defi> = {
        titre: formData.titre,
        ennonce: formData.description,
        dateAjout: formData.dateAjout,
        typeDefi: formData.typeDefis,
        pointDefi: this.totalPoints(),
        classe: formData.classeConcernee ? { id: +formData.classeConcernee } : undefined
      };

      this.isLoading = true;
      this.defisService.create(payload).subscribe({
        next: (res) => {
          const defiId = (res as any)?.id;
          if (!defiId) {
            this.isLoading = false;
            this.toast.warning('Défi créé mais identifiant introuvable pour créer les questions.');
            this.router.navigate(['/admin/defiList']);
            return;
          }

          const questionRequests: CreateQuestionRequest[] = this.questions.controls.map((ctrl: any) => {
            const v = ctrl.value;
            const type = this.mapFrontTypeToApi(String(v.typeQuestion || '').toLowerCase());
            if (type === 'APPARIEMENT') {
              const paires = (v.pairesAppariement || []) as Array<{elementGauche:string;elementDroit:string}>;
              const reponses = paires.map(p => ({ libelle: `${p.elementGauche} - ${p.elementDroit}`, estCorrecte: true }));
              return { defiId, enonce: v.question, points: v.points || 1, type, reponses };
            }
            if (type === 'VRAI_FAUX') {
              const reponses = [
                { libelle: 'VRAI', estCorrecte: (v.reponses || []).some((r:any)=> String(r.texte).toUpperCase()==='VRAI' && r.correcte) },
                { libelle: 'FAUX', estCorrecte: (v.reponses || []).some((r:any)=> String(r.texte).toUpperCase()==='FAUX' && r.correcte) }
              ];
              return { defiId, enonce: v.question, points: v.points || 1, type, reponses };
            }
            const reponses = (v.reponses || []).map((r:any) => ({ libelle: r.texte, estCorrecte: !!r.correcte }));
            return { defiId, enonce: v.question, points: v.points || 1, type, reponses };
          });

          forkJoin(questionRequests.map(req => this.questionsService.createQuestion(req))).subscribe({
            next: () => {
              this.isLoading = false;
              this.toast.success('Défi et questions créés avec succès !');
              this.router.navigate(['/admin/defiList']);
            },
            error: (err) => {
              this.isLoading = false;
              console.error('Erreur création questions du défi:', err);
              this.toast.error('Défi créé mais erreur lors de la création des questions');
              this.router.navigate(['/admin/defiList']);
            }
          });
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Erreur lors de la création du défi:', err);
          this.toast.error('Erreur lors de la création du défi. Veuillez réessayer.');
        }
      });
    } else {
      this.marquerChampsCommeTouches();
    }
  }

  // Annulation
  onAnnuler(): void {
    this.confirm.confirm({
      title: 'Annuler',
      message: 'Voulez-vous vraiment annuler ? Toutes les modifications seront perdues.',
      confirmText: 'Annuler',
      cancelText: 'Continuer'
    }).then(ok => {
      if (ok) {
        this.defiForm.reset();
        this.router.navigate(['/admin/defiList']);
      }
    });
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

  

  // Helpers
  totalPoints(): number {
    return this.questions.controls.reduce((acc, q: any) => acc + (q.get('points')?.value || 0), 0);
  }

  estFormulaireValide(): boolean {
    return this.defiForm.valid;
  }

  private mapFrontTypeToApi(front: string): 'QCU' | 'QCM' | 'VRAI_FAUX' | 'APPARIEMENT' {
    switch (front) {
      case 'choix_multiple':
        return 'QCU';
      case 'multi_reponse':
        return 'QCM';
      case 'vrai_faux':
        return 'VRAI_FAUX';
      case 'appariement':
        return 'APPARIEMENT';
      default:
        return 'QCU';
    }
  }

  private validateQuestionsBySpec(): boolean {
    return this.questions.controls.every((ctrl: any) => {
      const v = ctrl.value;
      if (!v.question || String(v.question).trim() === '') return false;
      const type = this.mapFrontTypeToApi(String(v.typeQuestion || '').toLowerCase());
      if (type === 'QCU') {
        const reps = v.reponses || [];
        return reps.length >= 2 && reps.filter((r:any)=>!!r.correcte).length === 1 && reps.every((r:any)=> String(r.texte||'').trim() !== '');
      }
      if (type === 'QCM') {
        const reps = v.reponses || [];
        return reps.length >= 2 && reps.filter((r:any)=>!!r.correcte).length >= 1 && reps.every((r:any)=> String(r.texte||'').trim() !== '');
      }
      if (type === 'VRAI_FAUX') {
        const reps = v.reponses || [];
        return reps.length === 2 && reps.filter((r:any)=>!!r.correcte).length === 1;
      }
      if (type === 'APPARIEMENT') {
        const p = v.pairesAppariement || [];
        return p.length >= 2 && p.every((x:any)=> String(x.elementGauche||'').trim()!=='' && String(x.elementDroit||'').trim()!=='');
      }
      return true;
    });
  }
}
