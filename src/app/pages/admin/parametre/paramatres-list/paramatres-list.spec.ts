import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ParamatresList } from './paramatres-list';

describe('ParamatresList', () => {
  let component: ParamatresList;
  let fixture: ComponentFixture<ParamatresList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ParamatresList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ParamatresList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
