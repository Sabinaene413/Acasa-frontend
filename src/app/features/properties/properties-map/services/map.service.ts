import { Injectable } from '@angular/core';
import { Property } from '../../models/property.model';

@Injectable({
  providedIn: 'root'
})
export class MapService {
  createClusterGroup(L: any, onPropertySelected: (id: number) => void): any {
    const clusterGroup = L.markerClusterGroup({
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      spiderfyOnMaxZoom: true,
      animate: true,
      animateAddingMarkers: true,
      iconCreateFunction: (cluster: any) => {
        return L.divIcon({
          className: '',
          html: `<div class="custom-cluster">${cluster.getChildCount()}</div>`,
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        });
      }
    });

    return clusterGroup;
  }

  createMarker(L: any, property: Property, onPropertySelected: (id: number) => void): any {
    const marker = L.marker([property.latitude, property.longitude], {
      icon: L.divIcon({
        className: '',
        html: `<div class="price-marker">${new Intl.NumberFormat('de-DE').format(property.price)} €</div>`,
        iconSize: [80, 30],
        iconAnchor: [40, 15],
      })
    });

    marker.bindPopup(this.createPopupHtml(property), { offset: L.point(0, -15) });
    
    return marker;
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
