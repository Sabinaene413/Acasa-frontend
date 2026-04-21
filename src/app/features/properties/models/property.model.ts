import { City } from "./city.model";

export interface Property {
  id?: number;
  userId?: string;
  title: string;
  description: string;
  price: number;
  address: string;
  bedrooms: number;
  bathrooms: number;
  surfaceArea: number;
  images: PropertyImage[];
  cityId: number;
  city?: City;
  latitude?: number;
  longitude?: number;
}

export interface PropertyImage {
  id: number;
  url: string;
}

export interface PropertyFilter {
  cityId?: number;
  countyId?: number;
  minPrice?: number;
  maxPrice?: number;
  minSurfaceArea?: number;
  maxSurfaceArea?: number;
  bedrooms?: number;
  bathrooms?: number;
  pageNumber?: number;
  pageSize?: number;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

export const DEFAULT_FILTER: PropertyFilter = {
  minPrice: 0,
  maxPrice: 1000000,
  minSurfaceArea: 0,
  maxSurfaceArea: 500,
  bedrooms: undefined,
  bathrooms: undefined,
  cityId: undefined,
  countyId: undefined,
  pageNumber: 1,
  pageSize: 12,
};