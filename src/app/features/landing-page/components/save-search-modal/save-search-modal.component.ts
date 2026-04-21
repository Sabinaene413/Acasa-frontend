import { Component, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SavedSearchService } from '../../../properties/services/saved-search.service';
import { PropertyFilter } from '../../../properties/models/property.model';
import { SavedSearch } from '../../../properties/models/saved-search.model';

@Component({
  selector: 'app-save-search-modal',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './save-search-modal.component.html',
})
export class SaveSearchModalComponent {
  private savedSearchService = inject(SavedSearchService);

  @Input({ required: true }) filter!: PropertyFilter;
  @Output() saved = new EventEmitter<SavedSearch>();
  @Output() close = new EventEmitter<void>();

  searchName = '';
  isSaving = signal(false);

  onSave() {
    if (!this.searchName.trim()) return;
    this.isSaving.set(true);

    this.savedSearchService.saveSearch({
      name: this.searchName,
      minPrice: this.filter.minPrice,
      maxPrice: this.filter.maxPrice === 999999999 ? undefined : this.filter.maxPrice,
      minSurfaceArea: this.filter.minSurfaceArea,
      maxSurfaceArea: this.filter.maxSurfaceArea === 999999999 ? undefined : this.filter.maxSurfaceArea,
      bedrooms: this.filter.bedrooms,
      bathrooms: this.filter.bathrooms,
      cityId: this.filter.cityId,
      countyId: this.filter.countyId,
    }).subscribe({
      next: (saved) => {
        this.saved.emit(saved);    
        this.isSaving.set(false);
        this.close.emit();         
      },
      error: () => this.isSaving.set(false),
    });
  }

  onClose() {
    this.close.emit();
  }
}