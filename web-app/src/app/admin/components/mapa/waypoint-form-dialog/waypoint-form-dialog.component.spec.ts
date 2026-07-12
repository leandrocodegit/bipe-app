import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WaypointFormDialogComponent } from './waypoint-form-dialog.component';

describe('WaypointFormDialogComponent', () => {
  let component: WaypointFormDialogComponent;
  let fixture: ComponentFixture<WaypointFormDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WaypointFormDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WaypointFormDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
