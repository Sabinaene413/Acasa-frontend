import { Component, ElementRef, ViewChild, AfterViewInit, input, effect, inject, signal, output } from '@angular/core';
import { Property } from '../../../models/property.model';
import { Router } from '@angular/router';
import { MapService } from '../../services/map.service';

@Component({
  selector: 'app-property-map-ui',
  standalone: true,
  templateUrl: './property-map.component.html',
  styles: [`
    :host { display: block; height: 100%; width: 100%; }
    ::ng-deep {
      .price-marker {
        background: white; border: 2px solid #ed985f; border-radius: 8px;
        padding: 2px 8px; font-weight: 700; color: #001f3d; font-size: 12px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15); white-space: nowrap;
        cursor: pointer; transition: all 0.2s ease-in-out;
      }
      .price-marker:hover { background: #ed985f; color: white; transform: scale(1.1); z-index: 1000 !important; }
      .custom-cluster {
        width: 40px; height: 40px; border-radius: 50%; background-color: #ed985f;
        color: white; font-weight: 700; font-size: 13px; display: flex;
        align-items: center; justify-content: center; border: 2px solid white;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      }
      .leaflet-popup-content-wrapper { border-radius: 12px; padding: 0; overflow: hidden; }
      .leaflet-popup-content { margin: 0; width: auto !important; }
    }
  `],
})
export class PropertyMapComponent implements AfterViewInit {
  private router = inject(Router);
  private mapService = inject(MapService);
  private mapInstance = signal<any>(undefined);
  private markerClusterGroup: any;

  @ViewChild('mapContainer') mapContainer!: ElementRef;

  properties = input<Property[]>([]);
  propertySelected = output<number>();

  constructor() {
    effect(() => {
      const props = this.properties();
      const map = this.mapInstance();
      if (map && props) {
        this.updateMarkers(map, props, true);
      }
    });
  }

  ngAfterViewInit() {
    this.loadLeaflet().then(() => this.initMap());
  }

  private loadLeaflet(): Promise<void> {
    return new Promise((resolve) => {
      if ((window as any).L && (window as any).L.markerClusterGroup) { resolve(); return; }
      const interval = setInterval(() => {
        if ((window as any).L && (window as any).L.markerClusterGroup) { clearInterval(interval); resolve(); }
      }, 50);
      setTimeout(() => { clearInterval(interval); resolve(); }, 5000);
    });
  }

  public resizeMap() {
    setTimeout(() => {
      const map = this.mapInstance();
      if (map) map.invalidateSize({ animate: true });
    }, 300);
  }

  private initMap() {
    const L = (window as any).L;

    const map = L.map(this.mapContainer.nativeElement, {
      maxZoom: 18,
      zoomControl: false
    }).setView([45.9432, 24.9668], 7);

    L.control.zoom({ position: 'topright' }).addTo(map);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    this.markerClusterGroup = this.mapService.createClusterGroup(L, (id) => this.propertySelected.emit(id));
    map.addLayer(this.markerClusterGroup);

    this.mapContainer.nativeElement.addEventListener('click', (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.classList.contains('view-details-btn')) {
        const id = target.getAttribute('data-id');
        if (id) this.propertySelected.emit(Number(id));
      }
    });

    this.mapInstance.set(map);
  }

  private updateMarkers(map: any, properties: Property[], shouldFitBounds: boolean = false) {
    const L = (window as any).L;

    if (!this.markerClusterGroup) return;

    this.markerClusterGroup.clearLayers();

    if (!properties || properties.length === 0) return;

    const validProperties = properties.filter(p => p.latitude != null && p.longitude != null);
    
    const markers = validProperties.map(p => this.mapService.createMarker(L, p, (id) => this.propertySelected.emit(id)));
    this.markerClusterGroup.addLayers(markers);

    if (shouldFitBounds && validProperties.length > 0) {
      const bounds = L.latLngBounds(validProperties.map(p => [p.latitude!, p.longitude!]));
      if (bounds.isValid()) {
        map.fitBounds(bounds.pad(0.1));
      }
    }
  }
}
