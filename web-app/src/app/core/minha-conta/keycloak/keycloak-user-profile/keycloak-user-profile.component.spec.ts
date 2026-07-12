import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KeycloakUserProfileComponent } from './keycloak-user-profile.component';

describe('KeycloakUserProfileComponent', () => {
  let component: KeycloakUserProfileComponent;
  let fixture: ComponentFixture<KeycloakUserProfileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KeycloakUserProfileComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KeycloakUserProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
