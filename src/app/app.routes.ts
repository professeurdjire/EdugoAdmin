import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import {AuthLayout} from './layouts/auth-layout/auth-layout';
import {Login} from './pages/auth/login/login';
import {AdminLayout} from './layouts/admin-layout/admin-layout';
import {Dashboard} from './pages/admin/dashboard/dashboard';
import {LivreList} from './pages/admin/livres/livre-list/livre-list';
import {LivreDetails} from './pages/admin/livres/livre-details/livre-details';
import {ChallengeList} from './pages/admin/challenge/challenge-list/challenge-list';
import {ChallengeForm} from './pages/admin/challenge/challenge-form/challenge-form';
import {ChallengeDetails} from './pages/admin/challenge/challenge-details/challenge-details';
import {NiveauxList} from './pages/admin/contenus/niveaux/niveaux-list/niveaux-list';
import {NiveauxForm} from './pages/admin/contenus/niveaux/niveaux-form/niveaux-form';
import {ClassesList} from './pages/admin/contenus/classes/classes-list/classes-list';
import {ClassesForm} from './pages/admin/contenus/classes/classes-form/classes-form';
import {MatieresList} from './pages/admin/contenus/matieres/matieres-list/matieres-list';
import {MatieresForm} from './pages/admin/contenus/matieres/matieres-form/matieres-form';
import {DefiList} from './pages/admin/defis/defi-list/defi-list';
import {DefiForm} from './pages/admin/defis/defi-form/defi-form';
import {ExerciceList} from './pages/admin/exercice/exercice-list/exercice-list';
import {ExerciceForm} from './pages/admin/exercice/exercice-form/exercice-form';
import {LivreForm} from './pages/admin/livres/livre-form/livre-form';
import {ParamatresList} from './pages/admin/parametre/paramatres-list/paramatres-list';
import {ParamatresForm} from './pages/admin/parametre/paramatres-form/paramatres-form';
import {QuizList} from './pages/admin/quiz/quiz-list/quiz-list';
import {QuizForm} from './pages/admin/quiz/quiz-form/quiz-form';
import {RecompenseList} from './pages/admin/recompense/recompense-list/recompense-list';
import {RecompenseForm} from './pages/admin/recompense/recompense-form/recompense-form';
import {RecompenseDetails} from './pages/admin/recompense/recompense-details/recompense-details';
import {UtilisateurList} from './pages/admin/utilisateurs/utilisateur-list/utilisateur-list';
import {UtilisateurForm} from './pages/admin/utilisateurs/utilisateur-form/utilisateur-form';
import {UtilisateurDetails} from './pages/admin/utilisateurs/utilisateur-details/utilisateur-details';
import {NotFound} from './pages/error/not-found/not-found';

export const routes: Routes = [
  { path: '', redirectTo: 'auth/login', pathMatch: 'full' },


  {
    path: 'auth',
    component: AuthLayout, // layout auth
    children: [
      {
        path: 'login',
        component: Login, // layout auth
      }
    ]
  },
  {
    path: 'admin',

    component: AdminLayout,
    children: [
      {
        path: 'dashboard',
        component: Dashboard, // layout auth
      },
      { path: 'challengeList', component: ChallengeList },
      { path: 'challengeForm', component: ChallengeForm },
      { path: 'editchallengeForm', component: ChallengeForm },
      { path: 'challengeDetails', component: ChallengeDetails },
      { path: 'niveaux', component: NiveauxList},
      { path: 'niveaux/ajouter', component: NiveauxForm },
      { path: 'niveaux/editer/:id', component: NiveauxForm },
      { path: 'classes', component: ClassesList },
      { path: 'classes/ajouter', component: ClassesForm },
      { path: 'classes/editer/:id', component: ClassesForm},
      { path: 'matieres', component: MatieresList },
      { path: 'matieres/ajouter', component: MatieresForm },
      { path: 'matieres/editer/:id', component: MatieresForm },
      { path: 'defiList', component: DefiList },
      { path: 'ajouterDefi', component: DefiForm },
      { path: 'editerdefi/:id', component: DefiForm},
      { path: 'exerciceList', component: ExerciceList },
      { path: 'ajouterExercice', component: ExerciceForm },
      { path: 'editerExercice/:id', component: ExerciceForm},
      { path: 'livreList', component: LivreList },
      { path: 'ajouterLivre', component: LivreForm },
      { path: 'editerLivre/:id', component: LivreForm },
      { path: 'editer:id', component: LivreDetails },
      //{ path: '', component: GeneralSettings},
      //{ path: 'profil', component: UserProfile },
      // { path: 'securite', component: SecuritySettings }
       { path: 'paramatresList', component: ParamatresList },
      { path: 'paramatresForm', component: ParamatresForm },
      { path: 'quizList', component: QuizList},
      { path: 'ajouterQuiz', component: QuizForm },
      { path: 'editerQuiz/:id', component: QuizForm },
      //{ path: ':id/questions', component: QuestionManagement}
      { path: 'recompenseList', component: RecompenseList },
      { path: 'ajouterRecompense', component: RecompenseForm },
      { path: 'editerRecompense/:id', component: RecompenseForm },
      { path: 'Recompense/:id', component: RecompenseDetails },
      { path: 'utilisateurs', component: UtilisateurList },
      { path: 'ajouterUtilisateur', component: UtilisateurForm },
      { path: 'editerUtilisateur/:id', component: UtilisateurForm },
      { path: 'Utilisateur/:id', component: UtilisateurDetails }
    ]
  },
  {
    path: '404',
    component: NotFound
  },
  { path: '**', redirectTo: '404' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
