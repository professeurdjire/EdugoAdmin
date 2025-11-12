import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SidebarStateService {
  private collapsedSubject = new BehaviorSubject<boolean>(false);
  collapsed$ = this.collapsedSubject.asObservable();

  get collapsed(): boolean {
    return this.collapsedSubject.value;
  }

  setCollapsed(value: boolean) {
    this.collapsedSubject.next(value);
  }

  toggle() {
    this.setCollapsed(!this.collapsedSubject.value);
  }
}
