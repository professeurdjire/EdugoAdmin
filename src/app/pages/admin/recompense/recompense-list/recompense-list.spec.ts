import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecompenseList } from './recompense-list';

describe('RecompenseList', () => {
  let component: RecompenseList;
  let fixture: ComponentFixture<RecompenseList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecompenseList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RecompenseList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
