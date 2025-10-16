import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClassesForm } from './classes-form';

describe('ClassesForm', () => {
  let component: ClassesForm;
  let fixture: ComponentFixture<ClassesForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClassesForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClassesForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
