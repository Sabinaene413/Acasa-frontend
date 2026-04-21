import { Component, OnInit, inject, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PropertyService } from '../services/property.service';
import { Property, PropertyFilter } from '../models/property.model';
import { NavbarComponent } from '../../../core/components/navbar/navbar.component';
import { CityService } from '../services/city.service';
import { County } from '../models/county.model';
import { PropertyMapComponent } from './components/property-map/property-map.component';
import { MapFilterSidebarComponent } from './components/map-filter-sidebar/map-filter-sidebar.component';
import { PropertyDetailsSidebarComponent } from './components/property-details-sidebar/property-details-sidebar.component';

@Component({
  selector: 'app-properties-map',
  standalone: true,
  imports: [
    CommonModule,
    NavbarComponent,
    PropertyMapComponent,
    MapFilterSidebarComponent,
    PropertyDetailsSidebarComponent,
  ],
  templateUrl: 'properties-map.component.html',
  styleUrl: 'properties-map.component.scss',
})
export class PropertiesMapComponent implements OnInit {
  private propertyService = inject(PropertyService);
  private cityService = inject(CityService);

  @ViewChild(PropertyMapComponent) mapComponent!: PropertyMapComponent;

  // Global State
  properties = signal<Property[]>([]);
  isLoading = signal(true);
  isSidebarOpen = signal(false);
  counties = signal<County[]>([]);

  // Selection State
  selectedProperty = signal<Property | null>(null);
  isDetailsSidebarOpen = signal(false);

  ngOnInit() {
    this.loadInitialData();
  }

  private loadInitialData() {
    this.cityService.getCounties().subscribe({
      next: (data) => this.counties.set(data),
      error: (err) => console.error('Error loading counties', err),
    });

    this.propertyService.getProperties().subscribe({
      next: (data) => {
        this.properties.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading properties', err);
        this.isLoading.set(false);
      },
    });
  }

  toggleSidebar() {
    this.isSidebarOpen.update((v) => !v);
    this.mapComponent.resizeMap();
  }

  onFilterApply(filters: PropertyFilter) {
    this.isLoading.set(true);
    this.propertyService.getFilteredProperties(filters).subscribe({
      next: (data) => {
        this.properties.set(data.items);
        this.isLoading.set(false);
        this.isSidebarOpen.set(false);
        this.mapComponent.resizeMap();
      },
      error: (err) => {
        console.error('Error applying filters', err);
        this.isLoading.set(false);
      },
    });
  }

  onPropertySelected(id: number) {
    const property = this.properties().find(p => p.id === id);
    if (property) {
      this.selectedProperty.set(property);
      this.isDetailsSidebarOpen.set(true);
      // Dacă sidebar-ul de filtre e deschis, îl închidem pentru a nu aglomera UI-ul
      if (this.isSidebarOpen()) this.isSidebarOpen.set(false);
      this.mapComponent.resizeMap();
    }
  }

  onDetailsClosed() {
    this.selectedProperty.set(null);
    this.isDetailsSidebarOpen.set(false);
    this.mapComponent.resizeMap();
  }
}
