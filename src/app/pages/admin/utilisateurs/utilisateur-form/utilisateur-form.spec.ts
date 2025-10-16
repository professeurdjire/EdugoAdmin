import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UtilisateurForm } from './utilisateur-form';

describe('UtilisateurForm', () => {
  let component: UtilisateurForm;
  let fixture: ComponentFixture<UtilisateurForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UtilisateurForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UtilisateurForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
