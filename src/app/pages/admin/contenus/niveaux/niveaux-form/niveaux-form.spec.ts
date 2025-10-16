import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NiveauxForm } from './niveaux-form';

describe('NiveauxForm', () => {
  let component: NiveauxForm;
  let fixture: ComponentFixture<NiveauxForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NiveauxForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NiveauxForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
