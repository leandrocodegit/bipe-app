import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShareDeviceComponent } from './share-device.component';

describe('ShareDeviceComponent', () => {
  let component: ShareDeviceComponent;
  let fixture: ComponentFixture<ShareDeviceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShareDeviceComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShareDeviceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
