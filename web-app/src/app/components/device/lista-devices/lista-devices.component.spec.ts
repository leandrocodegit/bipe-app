import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListaDevicesComponent } from './lista-devices.component';

describe('ListaDevicesComponent', () => {
  let component: ListaDevicesComponent;
  let fixture: ComponentFixture<ListaDevicesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListaDevicesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListaDevicesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
