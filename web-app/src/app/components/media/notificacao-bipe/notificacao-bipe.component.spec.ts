import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotificacaoBipeComponent } from './notificacao-bipe.component';

describe('NotificacaoBipeComponent', () => {
  let component: NotificacaoBipeComponent;
  let fixture: ComponentFixture<NotificacaoBipeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificacaoBipeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NotificacaoBipeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
