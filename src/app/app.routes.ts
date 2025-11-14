import { Component, NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthLayout } from './layouts/auth-layout/auth-layout';
import { AdminLayout } from './layouts/admin-layout/admin-layout';
import { Login } from './pages/auth/login/login';
import { Dashboard } from './pages/admin/dashboard/dashboard';
import { AuthGuard } from './core/guards/auth.guard';
import { ChallengeForm } from './pages/admin/challenge/challenge-form/challenge-form';
import { ChallengeDetails } from './pages/admin/challenge/challenge-details/challenge-details';

import { DefiForm } from './pages/admin/defis/defi-form/defi-form';
import { ExerciceForm } from './pages/admin/exercice/exercice-form/exercice-form';
import { LivreForm } from './pages/admin/livres/livre-form/livre-form';
import { ParamatresList } from './pages/admin/parametre/paramatres-list/paramatres-list';
import { ParamatresForm } from './pages/admin/parametre/paramatres-form/paramatres-form';
import { QuizForm } from './pages/admin/quiz/quiz-form/quiz-form';
import { RecompenseForm } from './pages/admin/recompense/recompense-form/recompense-form';
import { RecompenseList } from './pages/admin/recompense/recompense-list/recompense-list';
import {UtilisateurList} from './pages/admin/utilisateurs/utilisateur-list/utilisateur-list';
import {UtilisateurForm} from './pages/admin/utilisateurs/utilisateur-form/utilisateur-form';
import {LivreDetails} from './pages/admin/livres/livre-details/livre-details';

import {NotFound} from './pages/error/not-found/not-found';
import {QuizDetails} from './pages/admin/quiz/quiz-details/quiz-details';
import {DefiDetails} from './pages/admin/defis/defi-details/defi-details';
import {ExerciceDetails} from './pages/admin/exercice/exercice-details/exercice-details';

// Import the new list components
import { ChallengeList } from './pages/admin/challenge/challenge-list/challenge-list';
import { DefiList } from './pages/admin/defis/defi-list/defi-list';
import { ExerciceList } from './pages/admin/exercice/exercice-list/exercice-list';
import { LivreList } from './pages/admin/livres/livre-list/livre-list';
import { QuizList } from './pages/admin/quiz/quiz-list/quiz-list';
import { PartenaireList } from './pages/admin/partenaires/partenaire-list/partenaire-list';
import { PartenaireForm } from './pages/admin/partenaires/partenaire-form/partenaire-form';
import { Contenus } from './pages/admin/contenus/contenus';
import { NotificationsModalComponent } from './pages/admin/notifications/notifications';
import { UserProfileDropdownComponent } from './pages/admin/user-profile/user-profile';

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
    canActivate: [AuthGuard], // Add AuthGuard here
    children: [
      {
        path: 'dashboard',
        component: Dashboard, // layout auth
      },
      { path: 'ajouterchallenge', component: ChallengeForm },
      { path: 'challengedetails', component: ChallengeDetails },
      { path: 'challengeDetails/:id', component: ChallengeDetails },
      { path: 'challengelist', component: ChallengeList },
      { path: 'ajouterdefi', component: DefiForm },
      { path: 'ajouterdefi/:id', component: DefiForm },
      { path: 'defidetails', component: DefiDetails},
      { path: 'defiDetails/:id', component: DefiDetails},
      { path: 'defilist', component: DefiList },
      { path: 'ajouterexercice', component: ExerciceForm },
      { path: 'ajouterexercice/:id', component: ExerciceForm },
      { path: 'exercicedetails', component: ExerciceDetails},
      { path: 'exerciceDetails/:id', component: ExerciceDetails},
      { path: 'exercicelist', component: ExerciceList },
      { path: 'ajouterlivre', component: LivreForm },
      { path: 'ajouterlivre/:id', component: LivreForm },
      { path: 'livredetails', component: LivreDetails },
      { path: 'livreDetails/:id', component: LivreDetails },
      { path: 'livrelist', component: LivreList },
      //{ path: '', component: GeneralSettings},
      //{ path: 'profil', component: UserProfile },
      // { path: 'securite', component: SecuritySettings }
       { path: 'paramatresList', component: ParamatresList },
      { path: 'paramatresForm', component: ParamatresForm },
      { path: 'ajouterQuiz', component: QuizForm },
      { path: 'ajouterQuiz/:id', component: QuizForm },
      { path: 'quizdetails', component: QuizDetails },
      { path: 'quizDetails/:id', component: QuizDetails },
      { path: 'quizlist', component: QuizList },
      //{ path: ':id/questions', component: QuestionManagement}
      { path: 'recompenselist', component: RecompenseList },
      { path: 'ajouterrecompense', component: RecompenseForm },
      { path: 'editerrecompense/:id', component: RecompenseForm },
      { path: 'utilisateurs', component: UtilisateurList },
      { path: 'ajouterUtilisateur', component: UtilisateurForm },
      { path: 'editerUtilisateur/:id', component: UtilisateurForm },
      { path: 'contenus', component: Contenus },
       { path: 'partenaire', component: PartenaireList },
        { path: 'notifications', component: NotificationsModalComponent },
        { path: 'ajouterpartenaire', component: PartenaireForm },
        { path: 'ajouterpartenaire/:id', component: PartenaireForm },
        { path: 'user-profile', component: UserProfileDropdownComponent },
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