import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DefiList } from './defi-list';

describe('DefiList', () => {
  let component: DefiList;
  let fixture: ComponentFixture<DefiList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DefiList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DefiList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
