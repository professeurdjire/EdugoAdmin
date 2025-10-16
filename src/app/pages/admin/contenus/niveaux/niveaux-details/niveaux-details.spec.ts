import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NiveauxDetails } from './niveaux-details';

describe('NiveauxDetails', () => {
  let component: NiveauxDetails;
  let fixture: ComponentFixture<NiveauxDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NiveauxDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NiveauxDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
