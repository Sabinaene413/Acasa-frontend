import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class GeocodingService {
  private apiUrl = 'https://localhost:7102/api/geocoding';
  private http = inject(HttpClient);

  geocode(address: string, city: string): Observable<{latitude: number, longitude: number}> {
    return this.http.get<{latitude: number, longitude: number}>(
      `${this.apiUrl}?address=${encodeURIComponent(address)}&city=${encodeURIComponent(city)}`
    );
  }
}