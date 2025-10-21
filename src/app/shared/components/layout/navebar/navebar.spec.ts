import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Navebar } from './navebar';

describe('Navebar', () => {
  let component: Navebar;
  let fixture: ComponentFixture<Navebar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Navebar]
    })
      .compileComponents();

    fixture = TestBed.createComponent(Navebar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
