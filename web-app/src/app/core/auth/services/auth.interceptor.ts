import { HttpErrorResponse, HttpEvent, HttpHandler, HttpHeaders, HttpInterceptor, HttpRequest, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject, Subscription, catchError, debounceTime, filter, finalize, from, switchMap, take, tap, throwError, timeout } from 'rxjs';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';
import { OAuthService } from 'angular-oauth2-oidc';
import { MessageService } from 'primeng/api';
import { environment } from 'src/environments/environment';
import { LoadService } from '@/shared/components/preload/load.service';


@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(
    private router: Router,
    private authService: AuthService,
    private readonly loadService: LoadService,
    private readonly oauthService: OAuthService,
    private readonly messageService: MessageService) { }

  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {


    const isAccount = req.url.includes('/account') && !req.url.includes('/protocol/openid-connect/auth') && !req.url.includes('/login-actions')

    if (req.url.includes('192.168.15.200'))
      return next.handle(req);

    if (isAccount)
      return next.handle(req);

    this.setState();

    if (req.url.includes('/realms') || req.url.endsWith('/token') || (req.url.includes('/auth') && !req.url.includes('/authorization')) || req.url.includes('/engine-rest')) {
      return next.handle(req).pipe(
        timeout(environment.timeout)
      );
    } else {
      req = this.addToken(req, this.oauthService.getAccessToken());
    }
    if (!req.url.includes('noLoad=true') && !req.url.includes('/download') && !req.url.includes('tema') && !req.url.endsWith('formKey'))
      this.loadService.show();
    var requisicao = next.handle(req).pipe(
      timeout(environment.timeout),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          return this.handle401Error(req, next);
        } else if (error.status === 403) {
          //this.authService.logout();
          // this.router.navigate(['/login'])
          // this.authService.solicitarConfirmacao()
          return throwError(() => error);
        }
        else if (!req.url.includes('noLoad=true')) {
          if (error.status == 409 && error?.error?.message && !req.url.endsWith('formKey'))
            this.messageService.add({ severity: 'error', summary: 'Erro', detail: error?.error?.message });
          else if (error.status == 400 && error?.error?.message && !req.url.endsWith('formKey'))
            this.messageService.add({ severity: 'error', summary: 'Erro', detail: error?.error?.message });
          return throwError(() => error);
        }
      }),
      tap(event => {
        if (!req.url.includes('noLoad=true') && event instanceof HttpResponse && req.method !== 'GET' && req.method !== 'OPTIONS' && !req.url.includes('tema') && !req.url.includes('/list') && !req.url.includes('/processo/api/v1/history/task') && !req.url.includes('/processo/api/v1/history/process-instance') && !req.url.includes('/relatorio')) {
          this.messageService.add({ severity: 'success', detail: 'Salvo com sucesso' });
        }
      }),
      finalize(() => {
        this.loadService.hide()
      }),

    );
    return requisicao;
  }

  private handle401Error(request: HttpRequest<any>, next: HttpHandler) {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return this.authService.refreshToken().pipe(
        switchMap(() => {
          const newToken = this.oauthService.getAccessToken();
          this.isRefreshing = false;
          this.refreshTokenSubject.next(newToken);
          return next.handle(this.addToken(request, newToken)).pipe(
            timeout(environment.timeout)
          );
        }),
        catchError((error) => {
          if (error.status == 401) {
            this.isRefreshing = false;
            this.refreshTokenSubject.error(error);
            this.setState();
            this.router.navigate(['/login']);
          }
          return throwError(() => error);
        }),
        finalize(() => {
          this.isRefreshing = false;
        })
      );
    } else {
      // se já está atualizando, espera o novo token e repete a requisição
      return this.refreshTokenSubject.pipe(
        filter(token => token != null),
        take(1),
        switchMap(accessToken => next.handle(this.addToken(request, accessToken!)))
      );
    }
  }

  private addToken(request: HttpRequest<any>, token: string) {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  private setState() {
    if (this.router.url != '/' && !this.router.url.includes('/login') && !this.router.url.includes('/auth'))
      sessionStorage.setItem('returnUrl', this.router.url);
  }
}
