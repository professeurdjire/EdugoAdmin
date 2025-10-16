import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClassesDetails } from './classes-details';

describe('ClassesDetails', () => {
  let component: ClassesDetails;
  let fixture: ComponentFixture<ClassesDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClassesDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClassesDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
