import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UtilisateurList } from './utilisateur-list';

describe('UtilisateurList', () => {
  let component: UtilisateurList;
  let fixture: ComponentFixture<UtilisateurList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UtilisateurList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UtilisateurList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
