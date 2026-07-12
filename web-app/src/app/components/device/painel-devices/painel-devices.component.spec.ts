import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PainelDevicesComponent } from './painel-devices.component';

describe('PainelDevicesComponent', () => {
  let component: PainelDevicesComponent;
  let fixture: ComponentFixture<PainelDevicesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PainelDevicesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PainelDevicesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
