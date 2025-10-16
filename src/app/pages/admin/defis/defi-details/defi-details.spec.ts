import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DefiDetails } from './defi-details';

describe('DefiDetails', () => {
  let component: DefiDetails;
  let fixture: ComponentFixture<DefiDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DefiDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DefiDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
