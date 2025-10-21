import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ParamatresForm } from './paramatres-form';

describe('ParamatresForm', () => {
  let component: ParamatresForm;
  let fixture: ComponentFixture<ParamatresForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ParamatresForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ParamatresForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
