import { Injectable } from '@angular/core';
import { Property } from '../../models/property.model';

export interface MapCluster {
  lat: number;
  lng: number;
  count: number;
  properties: Property[];
}

@Injectable({
  providedIn: 'root'
})
export class MapService {
  clusterProperties(properties: Property[], zoom: number): MapCluster[] {
    const radius = 2 / Math.pow(2, zoom - 5);
    const clusters: MapCluster[] = [];
    const used = new Set<number>();
    const lngContext = Math.cos(45 * Math.PI / 180);

    properties.forEach((p, i) => {
      if (used.has(i)) return;
      const cluster: MapCluster = { lat: p.latitude!, lng: p.longitude!, count: 1, properties: [p] };
      used.add(i);

      properties.forEach((p2, j) => {
        if (used.has(j)) return;
        const latDist = p.latitude! - p2.latitude!;
        const lngDist = (p.longitude! - p2.longitude!) * lngContext;
        const dist = Math.sqrt(latDist * latDist + lngDist * lngDist);
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

  createPopupHtml(p: Property): string {
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
