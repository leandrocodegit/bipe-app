import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContentMapaComponent } from './content-mapa.component';

describe('ContentMapaComponent', () => {
  let component: ContentMapaComponent;
  let fixture: ComponentFixture<ContentMapaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContentMapaComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ContentMapaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
