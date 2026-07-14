const fs = require('fs');
const path = require('path');
 
const targetPath = path.resolve(__dirname, '../../../environments/environment.prod.ts');
// O script lê tudo do ambiente do Cloudflare
const mapboxToken = process.env.MAPBOX_TOKEN || '';
const sitekey = process.env.SITE_KEY || '';
 
const envConfigFile = `
export const environment =  
{
  production: true,
  portal: true,
  router: 'portal',
  urlApi: 'https://dev.simodapp.com:2087',
  urlWebSocket: 'broker.simodapp.com',
  portaWebSocket: 8084,
  protocoloWebSocket: 'wss' as 'wss' | 'ws',
  timeout: 30000,
  sitekey: '${sitekey}',
  mapboxToken: '${mapboxToken}',
  authConfig: {
    issuer: 'https://auth.simodapp.com:8443/realms/sincroled',
    redirectUri: window.location.origin + '/auth',
    postLogoutRedirectUri: window.location.origin,
    clientId: 'sincroled',
    responseType: 'code',
    scope: 'openid profile email',
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
  } 
}
`;

fs.writeFileSync(targetPath, envConfigFile, 'utf8');
console.log(`Ambiente de produção gerado com sucesso!`);