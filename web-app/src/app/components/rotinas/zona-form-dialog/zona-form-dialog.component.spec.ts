import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ZonaFormDialogComponent } from './zona-form-dialog.component';

describe('ZonaFormDialogComponent', () => {
  let component: ZonaFormDialogComponent;
  let fixture: ComponentFixture<ZonaFormDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ZonaFormDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ZonaFormDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
