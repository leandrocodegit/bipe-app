import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KeycloakAccountSettingsComponent } from './keycloak-account-settings.component';

describe('KeycloakAccountSettingsComponent', () => {
  let component: KeycloakAccountSettingsComponent;
  let fixture: ComponentFixture<KeycloakAccountSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KeycloakAccountSettingsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KeycloakAccountSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
