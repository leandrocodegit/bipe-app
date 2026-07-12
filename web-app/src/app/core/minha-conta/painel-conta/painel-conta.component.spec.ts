import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PainelContaComponent } from './painel-conta.component';

describe('PainelContaComponent', () => {
  let component: PainelContaComponent;
  let fixture: ComponentFixture<PainelContaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PainelContaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PainelContaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
