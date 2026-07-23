import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PainelRotinasComponent } from './painel-rotinas.component';

describe('PainelRotinasComponent', () => {
  let component: PainelRotinasComponent;
  let fixture: ComponentFixture<PainelRotinasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PainelRotinasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PainelRotinasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
