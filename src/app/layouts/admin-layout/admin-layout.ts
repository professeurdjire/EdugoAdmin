import { Component, ViewChild, Renderer2, ElementRef } from '@angular/core';
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
  @ViewChild(Sidebar) sidebar!: Sidebar;
  @ViewChild('adminLayout', { static: true }) adminLayout!: ElementRef;

  constructor(private renderer: Renderer2) {}

  toggleSidebar() {
    if (this.sidebar) {
      this.sidebar.toggleSidebar();
      // Toggle CSS class on admin layout
      if (this.adminLayout) {
        if (this.sidebar.isCollapsed) {
          this.renderer.addClass(this.adminLayout.nativeElement, 'sidebar-collapsed');
        } else {
          this.renderer.removeClass(this.adminLayout.nativeElement, 'sidebar-collapsed');
        }
      }
    }
  }
}