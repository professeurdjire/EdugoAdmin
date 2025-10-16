import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LivreForm } from './livre-form';

describe('LivreForm', () => {
  let component: LivreForm;
  let fixture: ComponentFixture<LivreForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LivreForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LivreForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
