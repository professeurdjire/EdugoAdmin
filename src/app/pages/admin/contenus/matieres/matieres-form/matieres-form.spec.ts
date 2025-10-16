import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MatieresForm } from './matieres-form';

describe('MatieresForm', () => {
  let component: MatieresForm;
  let fixture: ComponentFixture<MatieresForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatieresForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MatieresForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
