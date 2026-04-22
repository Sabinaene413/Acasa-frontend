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
  private markersCluster: any;

  @ViewChild('mapContainer') mapContainer!: ElementRef;

  properties = input<Property[]>([]);
  propertySelected = output<number>();

  constructor() {
    effect(() => {
      const props = this.properties();
      const map = this.mapInstance();
      if (map && this.markersCluster) this.updateMarkers(map, props);
    });
  }

  ngAfterViewInit() {
    const leaflet = (window as any).L;

    this.markersCluster = leaflet.markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 60,
      spiderfyOnMaxZoom: true,
      iconCreateFunction: (cluster: any) => leaflet.divIcon({
        html: `<div class="custom-cluster">${cluster.getChildCount()}</div>`,
        className: '', iconSize: [40, 40], iconAnchor: [20, 20]
      }),
    });

    this.initMap();
  }

  public resizeMap() {
    setTimeout(() => {
      const map = this.mapInstance();
      if (map) map.invalidateSize({ animate: true });
    }, 300);
  }

  private initMap() {
    const leaflet = (window as any).L;

    const map = leaflet.map(this.mapContainer.nativeElement, {
      maxZoom: 18,
      zoomControl: false
    }).setView([45.9432, 24.9668], 7);

    leaflet.control.zoom({ position: 'topright' }).addTo(map);
    map.addLayer(this.markersCluster);
    leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    this.mapContainer.nativeElement.addEventListener('click', (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.classList.contains('view-details-btn')) {
        const id = target.getAttribute('data-id');
        if (id) this.propertySelected.emit(Number(id));
      }
    });

    this.mapInstance.set(map);
  }

  private updateMarkers(map: any, properties: Property[]) {
    this.markersCluster.clearLayers();
    if (!properties || properties.length === 0) return;

    const leaflet = (window as any).L;

    const newMarkers = properties.map(p => {
      return leaflet.marker([p.latitude!, p.longitude!], {
        icon: leaflet.divIcon({
          className: '',
          html: `<div class="price-marker">${new Intl.NumberFormat('de-DE').format(p.price)} €</div>`,
          iconSize: [80, 30], iconAnchor: [40, 15],
        })
      }).bindPopup(this.createPopupHtml(p), { offset: leaflet.point(0, -15) });
    });

    this.markersCluster.addLayers(newMarkers);
    const bounds = this.markersCluster.getBounds();
    if (bounds.isValid()) map.fitBounds(bounds.pad(0.1));
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