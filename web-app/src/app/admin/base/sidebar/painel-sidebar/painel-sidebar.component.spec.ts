import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PainelSidebarComponent } from './painel-sidebar.component';

describe('PainelSidebarComponent', () => {
  let component: PainelSidebarComponent;
  let fixture: ComponentFixture<PainelSidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PainelSidebarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PainelSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
