import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModulosBarComponent } from './modulos-bar.component';

describe('ModulosBarComponent', () => {
  let component: ModulosBarComponent;
  let fixture: ComponentFixture<ModulosBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModulosBarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModulosBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
