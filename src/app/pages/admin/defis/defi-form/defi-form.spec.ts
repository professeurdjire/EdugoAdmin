import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DefiForm } from './defi-form';

describe('DefiForm', () => {
  let component: DefiForm;
  let fixture: ComponentFixture<DefiForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DefiForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DefiForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
