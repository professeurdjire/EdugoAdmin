import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChallengeForm } from './challenge-form';

describe('ChallengeForm', () => {
  let component: ChallengeForm;
  let fixture: ComponentFixture<ChallengeForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChallengeForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChallengeForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
