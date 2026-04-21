import { Injectable, inject } from '@angular/core';
import { MessageService } from 'primeng/api';

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private messageService = inject(MessageService);

  success(summary: string, detail?: string) {
    this.messageService.add({
      severity: 'success',
      summary: summary,
      detail: detail,
      life: 3000,
    });
  }

  info(summary: string, detail?: string) {
    this.messageService.add({
      severity: 'info',
      summary: summary,
      detail: detail,
      life: 3000,
    });
  }

  warn(summary: string, detail?: string) {
    this.messageService.add({
      severity: 'warn',
      summary: summary,
      detail: detail,
      life: 3000,
    });
  }

  error(summary: string, detail?: string) {
    this.messageService.add({
      severity: 'error',
      summary: summary,
      detail: detail,
      life: 5000,
    });
  }
}
