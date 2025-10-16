import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecompenseForm } from './recompense-form';

describe('RecompenseForm', () => {
  let component: RecompenseForm;
  let fixture: ComponentFixture<RecompenseForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecompenseForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RecompenseForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
