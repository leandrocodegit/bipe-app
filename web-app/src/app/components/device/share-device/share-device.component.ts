import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import * as QRCode from 'qrcode';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { TooltipModule } from 'primeng/tooltip';
import { Device, ShareRequest } from '@/shared/models/device.model';
import { DialogModule } from 'primeng/dialog';
import { SharedService } from '@/shared/services/shared.service';


@Component({
  selector: 'app-share-device',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    MessageModule,
    TooltipModule,
    DialogModule
  ],
  templateUrl: './share-device.component.html',
  styleUrls: ['./share-device.component.scss'],
})
export class ShareDeviceComponent implements OnChanges {

  @Input({ required: true }) device!: Device;
  @Input() shareLink: string | null = null;
  @Input() loadingLink = false;
  @Input() loadingQrCode = false;
  @Output() generateLink = new EventEmitter<ShareRequest>();
  @Output() generateQrCode = new EventEmitter<ShareRequest>();

  protected view = false;

  emailControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.email],
  });

  qrDataUrl: string | null = null;
  copied = false;

  private awaitingLinkForQr = false;
  private copiedTimeout?: ReturnType<typeof setTimeout>;

  constructor(
    private readonly sharedService: SharedService
  ) { }

  get deviceIcon(): string {
    const key = `${this.device?.clientId ?? ''} ${this.device?.username ?? ''}`.toLowerCase();
    if (key.includes('iphone') || key.includes('ios')) return 'pi pi-apple';
    if (key.includes('android')) return 'pi pi-android';
    if (key.includes('service') || key.includes('server') || key.includes('bot')) return 'pi pi-server';
    if (key.includes('tablet') || key.includes('ipad')) return 'pi pi-tablet';
    return 'pi pi-desktop';
  }

  get canShare(): boolean {
    return typeof navigator !== 'undefined' && !!navigator.share;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['shareLink'] && this.shareLink && this.awaitingLinkForQr) {
      this.awaitingLinkForQr = false;
      void this.renderQrCode(this.shareLink);
    }
    // Se o pai trocar o link (novo dispositivo, por ex.), descarta o QR antigo.
    if (changes['shareLink'] && !this.shareLink) {
      this.qrDataUrl = null;
    }
  }

  onGenerateLink(): void {
    if (!this.validateEmail()) {
      return;
    }
    this.sharedService.compartilhar(this.device.clientId, this.emailControl.value.trim()).subscribe(response => {
        this.shareLink = `${window.location.origin}/share/accept?payload=${response.payload}`;
    })
     
  }

  onGenerateQrCode(): void {
    if (!this.validateEmail()) {
      return;
    }
    if (this.shareLink) {
      void this.renderQrCode(this.shareLink);
      return;
    }
    this.awaitingLinkForQr = true;
    this.generateQrCode.emit(this.buildRequest());
  }

  async copyLink(): Promise<void> {
    if (!this.shareLink) {
      return;
    }
    try {
      await navigator.clipboard.writeText(this.shareLink);
      this.copied = true;
      clearTimeout(this.copiedTimeout);
      this.copiedTimeout = setTimeout(() => (this.copied = false), 2000);
    } catch {
      // Clipboard indisponível (ex: contexto não seguro); falha silenciosamente.
    }
  }

  async shareNative(): Promise<void> {
    if (!this.shareLink || !this.canShare) {
      return;
    }
    try {
      await navigator.share({
        title: `Acesso ao dispositivo ${this.device.nome}`,
        text: 'Você recebeu um convite para acessar este dispositivo.',
        url: this.shareLink,
      });
    } catch {
      // Usuário cancelou o compartilhamento; nada a fazer.
    }
  }

  downloadQrCode(): void {
    if (!this.qrDataUrl) {
      return;
    }
    const link = document.createElement('a');
    link.href = this.qrDataUrl;
    link.download = `qrcode-${this.device.nome}.png`;
    link.click();
  }

  private validateEmail(): boolean {
    this.emailControl.markAsTouched();
    return this.emailControl.valid;
  }

  private buildRequest(): ShareRequest {
    return { device: this.device, email: this.emailControl.value.trim() };
  }

  private async renderQrCode(link: string): Promise<void> {
    this.qrDataUrl = await QRCode.toDataURL(link, {
      width: 260,
      margin: 1,
      color: { dark: '#0f172a', light: '#ffffff' },
    });
  }
}