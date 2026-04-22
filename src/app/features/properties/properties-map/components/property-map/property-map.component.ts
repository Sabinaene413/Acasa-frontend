import { Component, ElementRef, ViewChild, AfterViewInit, input, effect, inject, signal, output } from '@angular/core';
import { Property } from '../../../models/property.model';
import { MapService } from '../services/map.service';

@Component({
  selector: 'app-property-map-ui',
  standalone: true,
  templateUrl: './property-map.component.html',
  styles: [`
    :host { display: block; height: 100%; width: 100%; }
    ::ng-deep {
      .price-marker, .custom-cluster {
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease-in-out;
      }
      .price-marker {
        background: white; border: 2px solid #ed985f; border-radius: 8px;
        padding: 2px 8px; font-weight: 700; color: #001f3d; font-size: 12px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15); white-space: nowrap;
        cursor: pointer;
      }
      .price-marker:hover { background: #ed985f; color: white; transform: scale(1.1) !important; z-index: 1000 !important; }
      .custom-cluster {
        width: 40px; height: 40px; border-radius: 50%; background-color: #ed985f;
        color: white; font-weight: 700; font-size: 13px; display: flex;
        align-items: center; justify-content: center; border: 2px solid white;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2); cursor: pointer;
      }
      .custom-cluster:hover { transform: scale(1.1) !important; background-color: #f0a575; }
      .leaflet-popup-content-wrapper { border-radius: 12px; padding: 0; overflow: hidden; }
      .leaflet-popup-content { margin: 0; width: auto !important; }
    }
  `],
})
export class PropertyMapComponent implements AfterViewInit {
  private mapService = inject(MapService);
  private mapInstance = signal<any>(undefined);
  private currentMarkers = new Map<string, any>();

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
      if ((window as any).L) { resolve(); return; }
      const interval = setInterval(() => {
        if ((window as any).L) { clearInterval(interval); resolve(); }
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

    map.on('zoomend', () => {
      const props = this.properties();
      if (props?.length) this.updateMarkers(map, props, false);
    });

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
    const validProperties = properties.filter(p => p.latitude != null && p.longitude != null);
    const clusters = this.mapService.clusterProperties(validProperties, map.getZoom());
    
    const nextMarkers = new Map<string, any>();

    clusters.forEach((cluster, idx) => {
      const key = cluster.count > 1 
        ? `cluster-${cluster.properties.sort((a,b) => a.id - b.id).map(p => p.id).join('-')}`
        : `prop-${cluster.properties[0].id}`;

      let marker = this.currentMarkers.get(key);

      if (marker) {
        marker.setLatLng([cluster.lat, cluster.lng]);
        this.currentMarkers.delete(key);
      } else {
        if (cluster.count > 1) {
          marker = L.marker([cluster.lat, cluster.lng], {
            icon: L.divIcon({
              className: '',
              html: `<div class="custom-cluster">${cluster.count}</div>`,
              iconSize: [40, 40], iconAnchor: [20, 20],
            })
          });
          marker.on('click', () => {
            const bounds = L.latLngBounds(cluster.properties.map((p: any) => [p.latitude, p.longitude]));
            map.fitBounds(bounds.pad(0.2));
          });
        } else {
          const p = cluster.properties[0];
          marker = L.marker([p.latitude, p.longitude], {
            icon: L.divIcon({
              className: '',
              html: `<div class="price-marker">${new Intl.NumberFormat('de-DE').format(p.price)} €</div>`,
              iconSize: [80, 30], iconAnchor: [40, 15],
            })
          }).bindPopup(this.mapService.createPopupHtml(p), { offset: L.point(0, -15) });
        }
        marker.addTo(map);
      }
      nextMarkers.set(key, marker);
    });

    this.currentMarkers.forEach(m => map.removeLayer(m));
    this.currentMarkers = nextMarkers;

    if (shouldFitBounds && validProperties.length > 0) {
      const bounds = L.latLngBounds(validProperties.map(p => [p.latitude!, p.longitude!]));
      if (bounds.isValid()) {
        map.fitBounds(bounds.pad(0.1));
      }
    }
  }
}
