import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExerciceDetails } from './exercice-details';

describe('ExerciceDetails', () => {
  let component: ExerciceDetails;
  let fixture: ComponentFixture<ExerciceDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExerciceDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExerciceDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
