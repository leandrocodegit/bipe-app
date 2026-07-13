import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PainelUsuarioLogadoComponent } from './painel-usuario-logado.component';

describe('PainelUsuarioLogadoComponent', () => {
  let component: PainelUsuarioLogadoComponent;
  let fixture: ComponentFixture<PainelUsuarioLogadoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PainelUsuarioLogadoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PainelUsuarioLogadoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
