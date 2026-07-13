import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

// Módulos PrimeNG
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { generateCodeChallenge, KeycloakService } from '@/shared/services/keycloak.service';
 import { AuthService } from '@/core/auth/services/auth.service';
import { ptBRTranslationMap } from '@/shared/models/translate';

// --- Interfaces para os dados do Keycloak ---
interface UserCredentialMetadata {
  credential: {
    id: string;
    type: string;
    createdDate: number;
    credentialData: string;
    userLabel?: string
  };
}

interface KeycloakAuthenticator {
  type: string;
  category: string;
  displayName: string;
  helptext: string;
  iconCssClass: string;
  createAction?: string; // Ação para adicionar
  updateAction?: string; // Ação para atualizar
  removeable: boolean;
  userCredentialMetadatas: UserCredentialMetadata[];
}

@Component({
  selector: 'app-keycloak-account-settings',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    TagModule,
    TooltipModule
  ],
  templateUrl: './keycloak-account-settings.component.html',
  styleUrls: ['./keycloak-account-settings.component.scss']
})
export class KeycloakAccountSettingsComponent implements OnInit {

  @Input() authenticators: KeycloakAuthenticator[] = [];
  protected configuredMethods: KeycloakAuthenticator[] = [];
  protected availableMethods: KeycloakAuthenticator[] = [];

  constructor(
    private readonly keycloakService: KeycloakService,
    private readonly authService: AuthService,
  ) { }


  ngOnInit(): void {
    this.keycloakService.listaCredenciais().subscribe(response => {
      this.configuredMethods = response;
      this.availableMethods = response;
    }, error => console.log(error.status)
    );
  }

  protected getIconForType(type: string): string {
    switch (type) {
      case 'password':
        return 'pi pi-key';
      case 'otp':
        return 'pi pi-mobile';
      case 'webauthn-passwordless':
        return 'pi pi-lock';
      default:
        return 'pi pi-shield';
    }
  }

  protected addMethod(action: string | undefined): void {
     generateCodeChallenge().then(code => {
      window.location.href = this.authService.getUrlUpdatePassword(code, action)
    })
  }

  protected updateMethod(action: string | undefined): void {
    generateCodeChallenge().then(code => {
      window.location.href = this.authService.getUrlUpdatePassword(code, action)
    })

  }

  protected removeMethod(id: string): void {
    generateCodeChallenge().then(code => {
      window.location.href = this.authService.getUrlUpdatePassword(code, `delete_credential:${id}`)
    });
  }

  getName(label: string) {
    if (ptBRTranslationMap.has(label))
      return ptBRTranslationMap.get(label);
    return label;
  }

  getNameCredential(auth: UserCredentialMetadata){
    if(auth.credential.type == 'password')
      return 'Minha Senha de Acesso';
    return auth.credential?.userLabel && auth.credential?.userLabel != '' ? auth.credential?.userLabel : auth.credential?.type
  }
}
