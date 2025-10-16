import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecompenseDetails } from './recompense-details';

describe('RecompenseDetails', () => {
  let component: RecompenseDetails;
  let fixture: ComponentFixture<RecompenseDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecompenseDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RecompenseDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
