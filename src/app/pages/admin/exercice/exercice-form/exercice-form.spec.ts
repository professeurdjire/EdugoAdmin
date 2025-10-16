import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExerciceForm } from './exercice-form';

describe('ExerciceForm', () => {
  let component: ExerciceForm;
  let fixture: ComponentFixture<ExerciceForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExerciceForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExerciceForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
