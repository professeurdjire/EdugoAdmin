import { Component } from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {Navebar} from '../../shared/components/layout/navebar/navebar';
import {Sidebar} from '../../shared/components/layout/sidebar/sidebar';

@Component({
  selector: 'app-admin-layout',
  standalone:true,
  imports: [RouterOutlet, Navebar, Sidebar],
  templateUrl: './admin-layout.html',
  styleUrls: ['./admin-layout.css'],
})
export class AdminLayout {

}
