import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KeycloakSessionTokenAuthComponent } from './keycloak-session-token-auth.component';

describe('KeycloakSessionTokenAuthComponent', () => {
  let component: KeycloakSessionTokenAuthComponent;
  let fixture: ComponentFixture<KeycloakSessionTokenAuthComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KeycloakSessionTokenAuthComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KeycloakSessionTokenAuthComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
