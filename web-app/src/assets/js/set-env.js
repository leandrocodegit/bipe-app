
const fs = require('fs');
const path = require('path');
 
const targetPath = './src/environments/environment.prod.ts';

const mapboxToken = process.env.MAP_BOX_TOKEN || '';
const sitekey = process.env.SITE_KEY || '';

console.log(process.env);
 
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
