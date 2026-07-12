import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KeycloakSessionsComponent } from './keycloak-sessions.component';

describe('KeycloakSessionsComponent', () => {
  let component: KeycloakSessionsComponent;
  let fixture: ComponentFixture<KeycloakSessionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KeycloakSessionsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KeycloakSessionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
