import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PartenaireList } from './partenaire-list';

describe('PartenaireList', () => {
  let component: PartenaireList;
  let fixture: ComponentFixture<PartenaireList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PartenaireList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PartenaireList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
