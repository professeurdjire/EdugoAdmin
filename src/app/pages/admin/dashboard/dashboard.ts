import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {
  faBook, faBookMedical,
  faFlagCheckered,
  faMedal,
  faPlusCircle,
  faSquarePollHorizontal,
  faUsers
} from '@fortawesome/free-solid-svg-icons';
import {FaIconComponent} from '@fortawesome/angular-fontawesome';
import {Navebar} from '../../../shared/components/layout/navebar/navebar';
import {Sidebar} from '../../../shared/components/layout/sidebar/sidebar';
@Component({
  selector: 'app-dashboard',
  imports: [
     CommonModule, FaIconComponent, Navebar, Sidebar
  ],
  templateUrl: './dashboard.html',

  standalone: true,
  styleUrl: './dashboard.css'
})
export class Dashboard {
  protected readonly faFlagCheckered = faFlagCheckered;
  protected readonly faSquarePollHorizontal = faSquarePollHorizontal;
  protected readonly faBook = faBook;
  protected readonly faUsers = faUsers;
  protected readonly faMedal = faMedal;
  protected readonly faPlusCircle = faPlusCircle;
  protected readonly faBookMedical = faBookMedical;
}
