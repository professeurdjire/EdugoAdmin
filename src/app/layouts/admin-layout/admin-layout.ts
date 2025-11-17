import { Component } from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {Navebar} from '../../shared/components/layout/navebar/navebar';
import {Sidebar} from '../../shared/components/layout/sidebar/sidebar';
import { SidebarStateService } from '../../shared/components/layout/sidebar/sidebar-state.service';
import { ToastContainer } from '../../shared/ui/toast/toast-container';
import { ConfirmContainer } from '../../shared/ui/confirm/confirm-container';

@Component({
  selector: 'app-admin-layout',
  standalone:true,
  imports: [RouterOutlet, Navebar, Sidebar, ToastContainer, ConfirmContainer],
  templateUrl: './admin-layout.html',
  styleUrls: ['./admin-layout.css'],
})
export class AdminLayout {
  isCollapsed = false;

  constructor(private sidebarState: SidebarStateService) {
    this.sidebarState.collapsed$.subscribe(v => (this.isCollapsed = v));
  }
}
