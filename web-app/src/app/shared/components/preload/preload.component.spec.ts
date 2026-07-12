import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PreloadComponent } from './preload.component';

describe('PreloadComponent', () => {
  let component: PreloadComponent;
  let fixture: ComponentFixture<PreloadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PreloadComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PreloadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
