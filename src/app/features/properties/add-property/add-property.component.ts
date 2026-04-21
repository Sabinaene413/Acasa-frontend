import {
  Component,
  inject,
  signal,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ViewChild,
  ElementRef,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PropertyService } from '../services/property.service';
import { CityService } from '../services/city.service';
import { ToastService } from '../../../core/services/toast.service';
import { NavbarComponent } from '../../../core/components/navbar/navbar.component';
import { City } from '../models/city.model';
import * as L from 'leaflet';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { GeocodingService } from '../../../core/services/geocoding.service';
import { SelectModule } from 'primeng/select';

@Component({
  selector: 'app-add-property',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, NavbarComponent, SelectModule],
  templateUrl: './add-property.component.html',
})
export class AddPropertyComponent implements OnInit, OnDestroy, AfterViewInit {
  private fb = inject(FormBuilder);
  private propertyService = inject(PropertyService);
  private cityService = inject(CityService);
  private geocodingService = inject(GeocodingService);
  private router = inject(Router);
  private toastService = inject(ToastService);
  private destroy$ = new Subject<void>();

  @ViewChild('mapContainer') mapContainer!: ElementRef;

  private map?: L.Map;
  private marker?: L.Marker;

  propertyForm: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(5)]],
    description: ['', [Validators.required, Validators.minLength(20)]],
    price: [0, [Validators.required, Validators.min(1)]],
    address: ['', [Validators.required]],
    cityId: ['', [Validators.required]],
    bedrooms: [0, [Validators.required, Validators.min(0)]],
    bathrooms: [0, [Validators.required, Validators.min(0)]],
    surfaceArea: [0, [Validators.required, Validators.min(1)]],
  });

  cities = signal<City[]>([]);
  selectedFiles = signal<File[]>([]);
  previews = signal<string[]>([]);
  isSubmitting = signal<boolean>(false);
  isGeocoding = signal<boolean>(false);
  locationConfirmed = signal<boolean>(false);
  confirmedLat = signal<number | null>(null);
  confirmedLng = signal<number | null>(null);

  ngOnInit() {
    this.cityService.getCities().subscribe({
      next: (data) => this.cities.set(data),
      error: (err) => console.error('Error loading cities:', err),
    });

    this.propertyForm
      .get('address')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.locationConfirmed.set(false);
      });

    this.propertyForm
      .get('cityId')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.locationConfirmed.set(false);
      });
  }

  ngAfterViewInit() {
    this.initMap();
  }

  private initMap() {
    if (!this.mapContainer) return;

    const iconRetinaUrl =
      'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png';
    const iconUrl =
      'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png';
    const shadowUrl =
      'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png';

    const iconDefault = L.icon({
      iconRetinaUrl,
      iconUrl,
      shadowUrl,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });
    L.Marker.prototype.options.icon = iconDefault;

    this.map = L.map(this.mapContainer.nativeElement).setView(
      [45.9432, 24.9668],
      7,
    );

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 18,
    }).addTo(this.map);
  }

  onVerifyLocation() {
    const address = this.propertyForm.get('address')?.value;
    const cityId = this.propertyForm.get('cityId')?.value;
    const city = this.cities().find((c) => c.id == cityId);

    if (!address || !city) {
      this.toastService.error(
        'Eroare',
        'Completează adresa și orașul înainte de a verifica locația.',
      );
      return;
    }

    this.isGeocoding.set(true);

    this.geocodingService.geocode(address, city.name).subscribe({
      next: (result) => {
        this.isGeocoding.set(false);
        this.placeMarker(result.latitude, result.longitude);
        this.locationConfirmed.set(true);
        this.confirmedLat.set(result.latitude);
        this.confirmedLng.set(result.longitude);
      },
      error: () => {
        this.isGeocoding.set(false);
        this.toastService.error(
          'Eroare',
          'Nu s-a putut găsi locația. Verifică adresa.',
        );
      },
    });
  }

  private placeMarker(lat: number, lng: number) {
    if (!this.map) return;

    if (this.marker) {
      this.marker.setLatLng([lat, lng]);
    } else {
      this.marker = L.marker([lat, lng], { draggable: true })
        .addTo(this.map)
        .bindPopup('Trage pinul pentru a ajusta locația')
        .openPopup();

      this.marker.on('dragend', () => {
        const pos = this.marker!.getLatLng();
        this.confirmedLat.set(pos.lat);
        this.confirmedLng.set(pos.lng);
      });
    }

    this.map.setView([lat, lng], 15);
  }

  isInvalid(controlName: string) {
    const control = this.propertyForm.get(controlName);
    return control && control.invalid && (control.dirty || control.touched);
  }

  onFileChange(event: any) {
    const files = Array.from(event.target.files as FileList);
    if (files.length > 0) {
      this.selectedFiles.update((current) => [...current, ...files]);

      files.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.previews.update((current) => [...current, e.target.result]);
        };
        reader.readAsDataURL(file);
      });
    }
  }

  removeImage(index: number) {
    this.selectedFiles.update((current) =>
      current.filter((_, i) => i !== index),
    );
    this.previews.update((current) => current.filter((_, i) => i !== index));
  }

  onSubmit() {
    if (this.propertyForm.valid) {
      this.isSubmitting.set(true);
      const formData = new FormData();

      Object.keys(this.propertyForm.value).forEach((key) => {
        formData.append(key, this.propertyForm.value[key]);
      });

      if (this.confirmedLat() !== null)
        formData.append('latitude', String(this.confirmedLat()));
      if (this.confirmedLng() !== null)
        formData.append('longitude', String(this.confirmedLng()));

      this.selectedFiles().forEach((file) => {
        formData.append('images', file);
      });

      this.propertyService.createProperty(formData).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.toastService.success(
            'Succes',
            'Anunțul a fost adăugat cu succes!',
          );
          this.router.navigate(['/']);
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.toastService.error(
            'Eroare',
            'A apărut o eroare la salvarea anunțului.',
          );
        },
      });
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.map?.remove();
  }
}
