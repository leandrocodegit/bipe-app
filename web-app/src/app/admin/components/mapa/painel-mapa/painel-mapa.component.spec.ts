import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PainelMapaComponent } from './painel-mapa.component';

describe('PainelMapaComponent', () => {
  let component: PainelMapaComponent;
  let fixture: ComponentFixture<PainelMapaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PainelMapaComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PainelMapaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
