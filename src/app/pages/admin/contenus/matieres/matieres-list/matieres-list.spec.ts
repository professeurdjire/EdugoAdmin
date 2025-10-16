import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MatieresList } from './matieres-list';

describe('MatieresList', () => {
  let component: MatieresList;
  let fixture: ComponentFixture<MatieresList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatieresList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MatieresList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
