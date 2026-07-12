import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardMapaCordenadasComponent } from './card-mapa-cordenadas.component';

describe('CardMapaCordenadasComponent', () => {
  let component: CardMapaCordenadasComponent;
  let fixture: ComponentFixture<CardMapaCordenadasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardMapaCordenadasComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CardMapaCordenadasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
