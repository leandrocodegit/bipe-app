import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, ValidatorFn } from '@angular/forms';

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
    MessageModule
  ],
  templateUrl: './keycloak-user-profile.component.html',
  styleUrls: ['./keycloak-user-profile.component.scss']
})
export class KeycloakUserProfileComponent implements OnInit {
  @Input() userData: any | null = null;
  @Output() onSave = new EventEmitter<Partial<KeycloakUser>>();
  private userDataCopy: any;

  protected formulario: any = {
    components: [],
    type: "default",
    id: 'user-profile',
    exporter: {
      name: "Camunda Modeler",
      version: "5.35.0"
    },
    executionPlatform: "Camunda Platform",
    executionPlatformVersion: "7.23.0",
    schemaVersion: 1
  };
  protected variaveis: any;
  protected profileForm: FormGroup;
  protected isLoading = false; // Para feedback de salvamento

  constructor(private fb: FormBuilder,
    private readonly keycloakService: KeycloakService) {
    // Inicializa o formulário vazio para evitar erros
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
      this.userDataCopy = JSON.parse(JSON.stringify(response));
      this.userData = response;

      if (this.userData) {
        response.userProfileMetadata.attributes.forEach((input: any) => {

          let validate = {
            required: input.required,
            minLength: 0,
            maxLength: 255
          };

          if (input?.validators?.length) {
            validate['minLength'] = input?.validators?.length.min;
            validate['maxLength'] = input?.validators?.length.max;
          }

        });
      }
      this.isLoading = false;
    });
  }

  protected enviarFormulario(event: any): void {
    this.keycloakService.salvarPerfil(event.data).subscribe();
  }
}

