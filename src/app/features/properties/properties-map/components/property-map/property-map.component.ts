import { Component, ElementRef, ViewChild, AfterViewInit, input, effect, inject, signal, output } from '@angular/core';
import { Property } from '../../../models/property.model';
import { Router } from '@angular/router';

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
  private mapInstance = signal<any>(undefined);
  private currentMarkers: any[] = [];

  @ViewChild('mapContainer') mapContainer!: ElementRef;

  properties = input<Property[]>([]);
  propertySelected = output<number>();

  constructor() {
    effect(() => {
      const props = this.properties();
      const map = this.mapInstance();
      if (map && props && props.length > 0) {
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

    // Șterge markerii vechi
    this.currentMarkers.forEach(m => map.removeLayer(m));
    this.currentMarkers = [];

    if (!properties || properties.length === 0) return;

    const zoom = map.getZoom();
    const clustered = this.clusterProperties(properties, zoom);

    clustered.forEach(cluster => {
      const marker = cluster.count > 1
        ? L.marker([cluster.lat, cluster.lng], {
            icon: L.divIcon({
              className: '',
              html: `<div class="custom-cluster">${cluster.count}</div>`,
              iconSize: [40, 40], iconAnchor: [20, 20],
            })
          })
        : L.marker([cluster.lat, cluster.lng], {
            icon: L.divIcon({
              className: '',
              html: `<div class="price-marker">${new Intl.NumberFormat('de-DE').format(cluster.properties[0].price)} €</div>`,
              iconSize: [80, 30], iconAnchor: [40, 15],
            })
          }).bindPopup(this.createPopupHtml(cluster.properties[0]), { offset: L.point(0, -15) });

      marker.addTo(map);
      this.currentMarkers.push(marker);
    });

    if (shouldFitBounds && this.currentMarkers.length > 0 && properties.length > 0) {
      const validCoords = properties
        .filter(p => p.latitude != null && p.longitude != null)
        .map(p => [p.latitude!, p.longitude!] as [number, number]);

      if (validCoords.length > 0) {
        const bounds = L.latLngBounds(validCoords);
        if (bounds.isValid()) {
          map.fitBounds(bounds.pad(0.1));
        }
      }
    }
  }

  private clusterProperties(properties: Property[], zoom: number): { lat: number, lng: number, count: number, properties: Property[] }[] {
    const radius = Math.max(0.01, 2 / Math.pow(2, zoom - 5));
    const clusters: { lat: number, lng: number, count: number, properties: Property[] }[] = [];
    const used = new Set<number>();

    properties.forEach((p, i) => {
      if (used.has(i)) return;
      const cluster = { lat: p.latitude!, lng: p.longitude!, count: 1, properties: [p] };
      used.add(i);

      properties.forEach((p2, j) => {
        if (used.has(j)) return;
        const dist = Math.sqrt(Math.pow(p.latitude! - p2.latitude!, 2) + Math.pow(p.longitude! - p2.longitude!, 2));
        if (dist < radius) {
          cluster.count++;
          cluster.properties.push(p2);
          cluster.lat = (cluster.lat * (cluster.count - 1) + p2.latitude!) / cluster.count;
          cluster.lng = (cluster.lng * (cluster.count - 1) + p2.longitude!) / cluster.count;
          used.add(j);
        }
      });

      clusters.push(cluster);
    });

    return clusters;
  }

  private createPopupHtml(p: Property): string {
    const imageUrl = p.images?.[0]?.url || 'assets/placeholder-property.jpg';
    return `
      <div class="w-56 p-0 overflow-hidden rounded-xl bg-white">
        <img src="${imageUrl}" class="w-full h-32 object-cover">
        <div class="p-3">
          <h3 class="font-bold text-navy truncate">${p.title}</h3>
          <p class="text-orange font-black">${new Intl.NumberFormat('de-DE').format(p.price)} €</p>
          <button class="view-details-btn mt-3 w-full py-2 bg-navy text-white text-xs font-bold rounded-lg hover:bg-orange transition-all cursor-pointer" data-id="${p.id}">
            Vezi Detalii
          </button>
        </div>
      </div>
    `;
  }
}