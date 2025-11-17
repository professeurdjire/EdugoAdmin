import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PartenaireForm } from './partenaire-form';

describe('PartenaireForm', () => {
  let component: PartenaireForm;
  let fixture: ComponentFixture<PartenaireForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PartenaireForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PartenaireForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
