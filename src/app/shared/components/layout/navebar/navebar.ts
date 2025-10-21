import { Component } from '@angular/core';
import {RouterLink, RouterLinkActive} from '@angular/router';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-navebar',
  imports: [RouterLink, CommonModule],
  templateUrl: './navebar.html',
  standalone: true,
  styleUrls: ['./navebar.css'],
})
export class Navebar {

}
