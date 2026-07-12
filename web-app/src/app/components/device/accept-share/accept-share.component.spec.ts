import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AcceptShareComponent } from './accept-share.component';

describe('AcceptShareComponent', () => {
  let component: AcceptShareComponent;
  let fixture: ComponentFixture<AcceptShareComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AcceptShareComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AcceptShareComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
