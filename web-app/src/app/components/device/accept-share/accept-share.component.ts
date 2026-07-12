import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SharedService } from '@/shared/services/shared.service';
 

type AcceptState = 'loading' | 'invalid' | 'expired' | 'ready' | 'submitting' | 'success' | 'error';

interface SharePreview {
  deviceName?: string;
  email?: string;
  exp?: number;
}

@Component({
  selector: 'app-accept-share',
  standalone: true,
  imports: [CommonModule, ButtonModule, ProgressSpinnerModule],
  templateUrl: './accept-share.component.html',
  styleUrls: ['./accept-share.component.scss'],
})
export class AcceptShareComponent implements OnInit {
  @Input() redirectUrl = '/';
  @Output() accepted = new EventEmitter<any>();
  @Output() declined = new EventEmitter<void>();

  state: AcceptState = 'loading';
  errorMessage = '';
  preview: SharePreview | null = null;

  private payload: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private readonly sharedService: SharedService
  ) {}

  ngOnInit(): void {
    const raw = this.route.snapshot.queryParamMap.get('payload');

    if (!raw || !raw.trim()) {
      this.state = 'invalid';
      return;
    }

    this.payload = raw.trim();
    this.preview = this.tryDecodePreview(this.payload);

    if (this.preview?.exp && this.isExpired(this.preview.exp)) {
      this.state = 'expired';
      return;
    }

    this.state = 'ready';
  }

  onAccept(): void {
    if (!this.payload || this.state === 'submitting') {
      return;
    }

    this.state = 'submitting';
    const request: any = { payload: this.payload };

    this.sharedService.aceiteCompartilhar(request).subscribe({
      next: (res) => {
        this.state = 'success';
        this.accepted.emit(res);
      },
      error: (err) => {
        this.state = 'error';
        this.errorMessage = this.extractErrorMessage(err);
      },
    });
  }

  onRetry(): void {
    this.state = 'ready';
    this.errorMessage = '';
  }

  onDecline(): void {
    this.declined.emit();
    this.router.navigateByUrl(this.redirectUrl);
  }

  onGoToApp(): void {
    this.router.navigateByUrl(this.redirectUrl);
  }

  private isExpired(exp: number): boolean {
    // `exp` de um JWT vem em segundos desde epoch.
    return Date.now() / 1000 > exp;
  }

  /**
   * Tentativa best-effort de decodificar o payload como JWT só para exibir
   * um preview amigável (nome do dispositivo / e-mail). Se não for um JWT
   * ou não tiver esses campos, a tela segue funcionando normalmente sem preview.
   */
  private tryDecodePreview(token: string): SharePreview | null {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    try {
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const json = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
          .join('')
      );
      const claims = JSON.parse(json);
      return {
        deviceName: claims.deviceName ?? claims.nome ?? undefined,
        email: claims.email ?? undefined,
        exp: claims.exp ?? undefined,
      };
    } catch {
      return null;
    }
  }

  private extractErrorMessage(err: any): string {
    const backendMessage = err?.error?.message || err?.error?.erro;

    console.log(backendMessage);
    
    if (typeof backendMessage === 'string' && backendMessage.trim()) {
      return backendMessage;
    }
    if (err?.status === 404 || err?.status === 410) {
      return 'Este convite não existe mais ou já expirou.';
    }
    if (err?.status === 409) {
      return 'Este convite já foi utilizado.';
    }
    return 'Não foi possível aceitar o compartilhamento. Tente novamente em instantes.';
  }
}