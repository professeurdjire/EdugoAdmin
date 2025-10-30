import { Component } from '@angular/core';
import {CommonModule, NgIf} from '@angular/common';
import {RouterLink, RouterLinkActive} from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.css']
})
export class Sidebar {

  isCollapsed = false; // état du sidebar

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
  }
}


