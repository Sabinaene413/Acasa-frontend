import { Component, OnInit, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SavedSearchService } from '../../../properties/services/saved-search.service';
import { AuthService } from '../../../../core/auth.service';
import { SavedSearch } from '../../../properties/models/saved-search.model';
import { PropertyFilter } from '../../../properties/models/property.model';

@Component({
  selector: 'app-saved-searches-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './saved-searches-bar.component.html',
})
export class SavedSearchesBarComponent implements OnInit {
  private savedSearchService = inject(SavedSearchService);
  private authService = inject(AuthService);

  @Output() applySearch = new EventEmitter<PropertyFilter>();

  savedSearches = signal<SavedSearch[]>([]);

  ngOnInit() {
    if (!this.authService.isAuthenticated()) return;
    this.savedSearchService.getSavedSearches().subscribe({
      next: (data) => this.savedSearches.set(data),
    });
  }

  // Metoda publica — apelata din save-search-modal via parent
  addSearch(search: SavedSearch) {
    this.savedSearches.update(current => [search, ...current]);
  }

  onApply(search: SavedSearch) {
    this.applySearch.emit(this.mapToFilter(search));
  }

  onDelete(id: number) {
    this.savedSearchService.deleteSearch(id).subscribe({
      next: () =>
        this.savedSearches.update(current => current.filter(s => s.id !== id)),
    });
  }

  private mapToFilter(search: SavedSearch): PropertyFilter {
    return {
      minPrice: search.minPrice ?? 0,
      maxPrice: search.maxPrice ?? 1000000,
      minSurfaceArea: search.minSurfaceArea ?? 0,
      maxSurfaceArea: search.maxSurfaceArea ?? 500,
      bedrooms: search.bedrooms,
      bathrooms: search.bathrooms,
      cityId: search.cityId,
      countyId: search.countyId,
    };
  }
}