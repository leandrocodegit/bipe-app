import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

// Módulos PrimeNG
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageModule } from 'primeng/message';
import { KeycloakService } from '@/shared/services/keycloak.service';

interface KeycloakUser {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  emailVerified: boolean;
  userProfileMetadata: any;
}

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    InputTextModule,
    ButtonModule,
    TagModule,
    TooltipModule,
    ProgressSpinnerModule,
    MessageModule,
  ],
  templateUrl: './keycloak-user-profile.component.html',
  styleUrls: ['./keycloak-user-profile.component.scss']
})
export class KeycloakUserProfileComponent implements OnInit {
  @Input() userData: any | null = null;
  @Output() onSave = new EventEmitter<Partial<KeycloakUser>>();

  protected profileForm: FormGroup;
  protected isLoading = false; // Para feedback de salvamento

  constructor(private fb: FormBuilder,
    private readonly keycloakService: KeycloakService) {

    this.profileForm = this.fb.group({
      username: [{ value: '', disabled: true }],
      email: ['', [Validators.email]],
      firstName: [''],
      lastName: ['']
    });
  }

  ngOnInit(): void {
    this.isLoading = true;
    this.keycloakService.getPerfil().subscribe(response => {
      this.userData = response;

      if (this.userData) {
        this.profileForm = this.fb.group({
          username: [{ value: this.userData.username, disabled: true }, [Validators.required]],
          email: [this.userData.email, [Validators.email, Validators.required]],
          firstName: [this.userData.firstName, [Validators.required]],
          lastName: [this.userData.lastName, [Validators.required]]
        });
      }
      this.isLoading = false;
    });
  }

  protected enviarFormulario(): void {
    this.isLoading = true;
    this.keycloakService.salvarPerfil(this.profileForm.getRawValue()).subscribe({
      next: () => {
        this.isLoading = false;
      }, error: () => this.isLoading = false
    });
  }

  isInvalid(field: string): boolean {
    return !!this.profileForm.get(field)?.touched && !this.profileForm.get(field)?.valid;
  }
}

