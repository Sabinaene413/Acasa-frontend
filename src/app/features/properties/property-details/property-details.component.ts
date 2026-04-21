import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  ElementRef,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PropertyService } from '../services/property.service';
import { Property } from '../models/property.model';
import { NavbarComponent } from '../../../core/components/navbar/navbar.component';
import * as L from 'leaflet';

@Component({
  selector: 'app-property-details',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent],
  templateUrl: './property-details.component.html',
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class PropertyDetailsComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  private route = inject(ActivatedRoute);
  private propertyService = inject(PropertyService);


  property?: Property;
  currentImage: string = '';
  showPhone: boolean = false;
  private map?: L.Map;

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.propertyService.getProperty(+id).subscribe({
        next: (data) => {
          this.property = data;
          if (this.property.images && this.property.images.length > 0) {
            this.currentImage = this.property.images[0].url;
          }
          if (this.property.latitude && this.property.longitude) {
            setTimeout(() => this.initMap(), 100);
          }
        },
        error: (err) => console.error('Error fetching property:', err),
      });
    }
  }

  togglePhone() {
    this.showPhone = !this.showPhone;
  }

  ngAfterViewInit() {}

  private initMap() {
    const container = document.getElementById('propertyMap');
    if (!container) return;

    const iconRetinaUrl =
      'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png';
    const iconUrl =
      'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png';
    const shadowUrl =
      'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png';

    L.Marker.prototype.options.icon = L.icon({
      iconRetinaUrl,
      iconUrl,
      shadowUrl,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });

    const lat = this.property!.latitude!;
    const lng = this.property!.longitude!;

    this.map = L.map(container, {
      zoomControl: true,
      scrollWheelZoom: false, // mai plăcut pe pagini de detaliu
    }).setView([lat, lng], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 18,
    }).addTo(this.map);

    L.marker([lat, lng])
      .addTo(this.map)
      .bindPopup(this.property!.address)
      .openPopup();
  }

  ngOnDestroy() {
    this.map?.remove();
  }
}
