import { HttpHeaders } from "@angular/common/http";

export const environment = {
  production: true,
  portal: true,
  router: 'portal',
  urlApi: 'https://dev.simodapp.com:2087',
  urlWebSocket: 'broker.simodapp.com',
  portaWebSocket: 2053,
  protocoloWebSocket: 'wss' as 'wss' | 'ws',
  timeout: 30000,
  sitekey: '0x4AAAAAABer05zX5CdsZSWY',
  authConfig: {
    issuer: `https://auth.simodapp.com:8443/realms/${window.location.hostname}`,
    redirectUri: window.location.origin + '/auth',
    postLogoutRedirectUri: window.location.origin,
    clientId: window.location.hostname,
    responseType: 'code',
    scope: `openid profile email`,
    showDebugInformation: true,
    strictDiscoveryDocumentValidation: false,
    timeoutFactor: 0.75,
    sessionChecksEnabled: true,
    silentRefreshTimeout: 5000,
    silentRefreshRedirectUri: window.location.origin + '/assets/silent-refresh.html',
    useSilentRefresh: true,
    decreaseExpirationBySec: 10000,
    clockSkewInSec: 0,
    requireHttps: true
  },
  headers: {
    headers: new HttpHeaders({
      "Content-Type": "application/json"
    })
  },
};

