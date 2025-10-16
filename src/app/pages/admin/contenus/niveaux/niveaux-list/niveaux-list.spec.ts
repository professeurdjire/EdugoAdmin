import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NiveauxList } from './niveaux-list';

describe('NiveauxList', () => {
  let component: NiveauxList;
  let fixture: ComponentFixture<NiveauxList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NiveauxList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NiveauxList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
