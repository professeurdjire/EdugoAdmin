import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LivreDetails } from './livre-details';

describe('LivreDetails', () => {
  let component: LivreDetails;
  let fixture: ComponentFixture<LivreDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LivreDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LivreDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
