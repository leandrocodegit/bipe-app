import { NgModule } from '@angular/core';
import { OAuthModule } from 'angular-oauth2-oidc';

@NgModule({
  imports: [
    OAuthModule.forRoot({
      resourceServer: {
        allowedUrls: ['*'],
        sendAccessToken: true,
      },
    }),
  ],
})
export class AppModule { }

import { AuthConfig } from 'angular-oauth2-oidc';
import { environment } from '../environments/environment';
export const authConfig: AuthConfig = environment.authConfig

