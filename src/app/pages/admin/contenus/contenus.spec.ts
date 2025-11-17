import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Contenus } from './contenus';

describe('Contenus', () => {
  let component: Contenus;
  let fixture: ComponentFixture<Contenus>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Contenus]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Contenus);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
