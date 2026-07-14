export const environment = {
  production: false,
  portal: true,
  router: 'portal',
  urlApi: 'https://dev.simodapp.com:2087',
  urlWebSocket: 'broker.simodapp.com',
  portaWebSocket: 8084,
  protocoloWebSocket: 'wss' as 'wss' | 'ws',
  timeout: 100000,
  sitekey: '',
  mapboxToken: '',
  authConfig: {
    issuer: `https://auth.simodapp.com:8443/realms/sincroled`,
    redirectUri: window.location.origin + '/auth',
    postLogoutRedirectUri: window.location.origin,
    clientId: 'sincroled',
    responseType: 'code',
    scope: `openid profile email`,
    showDebugInformation: false,
    strictDiscoveryDocumentValidation: false,
    // timeoutFactor: 0.20,
    // sessionChecksEnabled: false,
    //silentRefreshRedirectUri: window.location.origin + '/assets/silent-refresh.html',
    //  useSilentRefresh: false,
    decreaseExpirationBySec: 10000,
    clockSkewInSec: 0,
    requireHttps: false
  }
};
