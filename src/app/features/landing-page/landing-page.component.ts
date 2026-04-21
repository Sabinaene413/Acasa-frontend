import { Component, inject, signal, ViewChild } from "@angular/core";
import { PropertySearchFormComponent } from "./components/property-search-form/property-search-form.component";
import { NavbarComponent } from "../../core/components/navbar/navbar.component";
import { PropertyResultsGridComponent } from "./components/property-results-grid/property-results-grid.component";
import { PropertyFilter, Property, DEFAULT_FILTER } from "../properties/models/property.model";
import { SavedSearch } from "../properties/models/saved-search.model";
import { PropertyService } from "../properties/services/property.service";
import { SaveSearchModalComponent } from "./components/save-search-modal/save-search-modal.component";
import { SavedSearchesBarComponent } from "./components/saved-searches-bar/saved-searches-bar.component";
import { PaginationComponent } from "../../shared/components/pagination/pagination.component";

@Component({
  standalone: true,
  imports: [
    NavbarComponent,
    PropertySearchFormComponent,
    PropertyResultsGridComponent,
    SavedSearchesBarComponent,
    SaveSearchModalComponent,
    PaginationComponent
  ],
  templateUrl: './landing-page.component.html',
})
export class LandingPageComponent {
  private propertyService = inject(PropertyService);

  @ViewChild(SavedSearchesBarComponent)
  savedSearchesBar!: SavedSearchesBarComponent;

  showSaveModal = signal(false);
  currentFilter = signal<PropertyFilter>(DEFAULT_FILTER);
  properties = signal<Property[]>([]);
  totalCount = signal(0);
  isLoading = signal(false);

  constructor() {
    this.onSearch(DEFAULT_FILTER); 
  }

  onSearch(filter: PropertyFilter) {
    // Dacă filtrul s-a schimbat (nu e doar schimbare de pagină), resetăm pagina la 1
    if (this.isFilterChanged(this.currentFilter(), filter)) {
      filter.pageNumber = 1;
    }

    this.currentFilter.set(filter);
    this.isLoading.set(true);

    this.propertyService.getFilteredProperties(filter).subscribe({
      next: (results) => {
        this.properties.set(results.items);
        this.totalCount.set(results.totalCount);
        this.isLoading.set(false);
        window.scrollTo({ top: 400, behavior: 'smooth' });
      },
      error: () => this.isLoading.set(false),
    });
  }

  onPageChange(page: number) {
    const newFilter = { ...this.currentFilter(), pageNumber: page };
    this.onSearch(newFilter);
  }

  private isFilterChanged(oldFilter: PropertyFilter, newFilter: PropertyFilter): boolean {
    // Comparație simplificată - dacă orice în afară de pageNumber s-a schimbat
    return (
      oldFilter.cityId !== newFilter.cityId ||
      oldFilter.countyId !== newFilter.countyId ||
      oldFilter.minPrice !== newFilter.minPrice ||
      oldFilter.maxPrice !== newFilter.maxPrice ||
      oldFilter.minSurfaceArea !== newFilter.minSurfaceArea ||
      oldFilter.maxSurfaceArea !== newFilter.maxSurfaceArea ||
      oldFilter.bedrooms !== newFilter.bedrooms ||
      oldFilter.bathrooms !== newFilter.bathrooms
    );
  }

  onSearchSaved(search: SavedSearch) {
    this.savedSearchesBar.addSearch(search); // adaugă în listă fără re-fetch
    this.showSaveModal.set(false);
  }
}