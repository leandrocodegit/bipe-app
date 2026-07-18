import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistoricoRotinasComponent } from './historico-rotinas.component';

describe('HistoricoRotinasComponent', () => {
  let component: HistoricoRotinasComponent;
  let fixture: ComponentFixture<HistoricoRotinasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistoricoRotinasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HistoricoRotinasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
