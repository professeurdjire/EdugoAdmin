import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MatieresDetails } from './matieres-details';

describe('MatieresDetails', () => {
  let component: MatieresDetails;
  let fixture: ComponentFixture<MatieresDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatieresDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MatieresDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
