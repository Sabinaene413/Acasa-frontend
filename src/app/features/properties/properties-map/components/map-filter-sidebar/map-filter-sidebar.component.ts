import { Component, input, output, model, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { County } from '../../../models/county.model';
import { PropertyFilter } from '../../../models/property.model';

@Component({
  selector: 'app-map-filter-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule, SelectModule, InputNumberModule, ButtonModule],
  templateUrl: './map-filter-sidebar.component.html',
  styles: [`
    .custom-scrollbar {
      &::-webkit-scrollbar { width: 6px; }
      &::-webkit-scrollbar-track { background: transparent; }
      &::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
      &::-webkit-scrollbar-thumb:hover { background: #d1d5db; }
    }
  `]
})
export class MapFilterSidebarComponent {
  counties = input<County[]>([]);
  isOpen = model(false);
  filterChanged = output<PropertyFilter>();

  selectedCountyId = signal<number | null>(null);
  minPrice = signal<number | null>(null);
  maxPrice = signal<number | null>(null);
  selectedBedrooms = signal<number | null>(null);

  reset() {
    this.selectedCountyId.set(null);
    this.minPrice.set(null);
    this.maxPrice.set(null);
    this.selectedBedrooms.set(null);
    // Opțional: emitem resetarea imediat sau lăsăm utilizatorul să apese "Aplică"
    this.apply();
  }

  apply() {
    this.filterChanged.emit({
      countyId: this.selectedCountyId() ?? undefined,
      minPrice: this.minPrice() ?? undefined,
      maxPrice: this.maxPrice() ?? undefined,
      bedrooms: this.selectedBedrooms() ?? undefined,
    });
  }

  selectBedrooms(count: number) {
    this.selectedBedrooms.set(this.selectedBedrooms() === count ? null : count);
  }

  close() {
    this.isOpen.set(false);
  }
}
