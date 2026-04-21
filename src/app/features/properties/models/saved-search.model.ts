export interface SavedSearch {
  id: number;
  name: string;
  minPrice?: number;
  maxPrice?: number;
  minSurfaceArea?: number;
  maxSurfaceArea?: number;
  bedrooms?: number;
  bathrooms?: number;
  cityId?: number;
  countyId?: number;
  createdAt: Date;
}

export interface SavedSearchCreate {
  name: string;
  minPrice?: number;
  maxPrice?: number;
  minSurfaceArea?: number;
  maxSurfaceArea?: number;
  bedrooms?: number;
  bathrooms?: number;
  cityId?: number;
  countyId?: number;
}