import { Component, input, model, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Property } from '../../../models/property.model';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-property-details-sidebar',
  standalone: true,
  imports: [CommonModule, ButtonModule, RouterModule],
  templateUrl: './property-details-sidebar.component.html',
  styles: [`
    .custom-scrollbar {
      &::-webkit-scrollbar { width: 4px; }
      &::-webkit-scrollbar-track { background: transparent; }
      &::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
    }
  `]
})
export class PropertyDetailsSidebarComponent {
  property = input<Property | null>(null);
  isOpen = model(false);
  closeSidebar = output<void>();

  showPhone = signal(false);

  onClose() {
    this.isOpen.set(false);
    this.closeSidebar.emit();
    this.showPhone.set(false);
  }

  togglePhone() {
    this.showPhone.update(v => !v);
  }
}
