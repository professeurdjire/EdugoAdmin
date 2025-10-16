import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExerciceList } from './exercice-list';

describe('ExerciceList', () => {
  let component: ExerciceList;
  let fixture: ComponentFixture<ExerciceList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExerciceList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExerciceList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
