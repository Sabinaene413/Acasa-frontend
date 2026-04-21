import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { City } from '../models/city.model';
import { County } from '../models/county.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CityService {
  private apiUrl = 'https://localhost:7102/api/Cities';
  private http = inject(HttpClient);

  getCities(): Observable<City[]> {
    return this.http.get<City[]>(this.apiUrl);
  }

  getCounties(): Observable<County[]> {
    return this.http.get<County[]>('https://localhost:7102/api/Counties');
  }

  getCitiesByCounty(countyId: number): Observable<City[]> {
    return this.http.get<City[]>(`${this.apiUrl}?countyId=${countyId}`);
  }
}
