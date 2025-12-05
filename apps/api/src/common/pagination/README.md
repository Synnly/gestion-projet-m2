# Pagination & Filtering Guide

A simple, practical guide to using the pagination system with dynamic filters.

## Overview

This folder contains everything you need to paginate and filter data in your API:

- **`PaginationDto`** - Validates incoming query parameters
- **`QueryBuilder`** - Converts those params into MongoDB filters
- **`PaginationService`** - Executes the query and returns paginated results

## How It Works

### 1. Request Comes In

A client hits your endpoint with query params:

```
GET /posts?page=2&limit=20&searchQuery=developer&sector=IT&minSalary=2000
```

### 2. PaginationDto Validates

The DTO automatically validates and transforms the query string:

```typescript
{
  page: 2,           // Converted to number, must be >= 1
  limit: 20,         // Converted to number, capped at 100
  searchQuery: "developer",
  sector: "IT",
  minSalary: 2000
}
```

**Protection built-in:**
- `page` must be at least 1
- `limit` is capped at 100 to prevent abuse
- All types are automatically converted (strings → numbers, etc.)

### 3. QueryBuilder Creates Filters

Takes the validated DTO and builds a MongoDB filter:

```typescript
const qb = new QueryBuilder(filters, geoService);
const filter = await qb.build();

// Result:
{
  $text: { $search: "developer" },  // Uses text index for performance
  sector: { $regex: "^IT$", $options: "i" },
  maxSalary: { $gte: 2000 },
  isVisible: true
}
```

**Smart features:**
- Uses MongoDB text index for global search (fast!)
- Falls back to regex if text index doesn't exist
- Handles salary ranges with overlap logic
- Geocodes addresses for location-based search
- Always filters `isVisible: true`

### 4. PaginationService Executes

Runs the query and returns structured results:

```typescript
const result = await paginationService.paginate(
  model,
  filter,
  page,
  limit,
  [populate],
  sort
);

// Returns:
{
  data: [...],        // The actual items
  total: 147,         // Total matching items
  page: 2,
  limit: 20,
  totalPages: 8,
  hasNext: true,
  hasPrev: true
}
```

## Quick Examples

### Basic Pagination

```typescript
// In your controller
async findAll(@Query() query: PaginationDto) {
  const { page, limit, sort, ...filters } = query;
  
  const qb = new QueryBuilder(filters, this.geoService);
  const filter = await qb.build();
  
  return this.paginationService.paginate(
    this.model,
    filter,
    page,
    limit,
    [], // populate
    qb.buildSort()
  );
}
```

### With Search

```
GET /posts?searchQuery=backend&page=1&limit=10
```

Searches across `title`, `description`, `sector`, `duration`, and `keySkills`.

### With Filters

```
GET /posts?sector=IT&type=Télétravail&minSalary=2000&maxSalary=4000
```

Combines multiple filters - only posts matching ALL criteria are returned.

### With Location

```
GET /posts?city=Paris&radiusKm=50
```

The QueryBuilder geocodes "Paris" and finds posts within 50km radius.

### With Sorting

```
GET /posts?sort=dateDesc
```

Options: `dateAsc`, `dateDesc` (default is `dateDesc`).

## Filter Types Explained

### Text Search (`searchQuery`)
- Uses MongoDB text index
- Searches: title, description, sector, duration, keySkills
- Case-insensitive

### Exact Filters
- `sector` - Exact match (case-insensitive)
- `type` - Exact match (Présentiel/Télétravail/Hybride)
- `company` - Filter by company ID

### Regex Filters
- `title`, `description`, `duration` - Partial match (case-insensitive)

### Salary Range
- `minSalary` - Post's max salary must be >= this value
- `maxSalary` - Post's min salary must be <= this value
- Both together = overlap logic (finds posts whose range intersects yours)

### Skills
- `keySkills` - Accepts string or array
- Matches if post has ANY of the skills you specify

### Location
- `city` + `radiusKm` - Geocodes city, finds posts within radius
- Uses 2dsphere index for performance

## Performance Tips

### Indexes Are Critical

The schema defines these indexes for fast queries:

```typescript
// Compound indexes (most important!)
{ company: 1, isVisible: 1, createdAt: -1 }  // Main query pattern
{ isVisible: 1, sector: 1 }                  // Filter by sector
{ isVisible: 1, type: 1 }                    // Filter by type

// Text index for search
{ title: 'text', description: 'text', ... }

// Geospatial
{ location: '2dsphere' }
```

### Geocoding Cache

The GeoService caches geocoded addresses in memory:
- Same city searched twice? Second time is instant
- Rate-limited to 1 req/sec to respect Nominatim's policy
- Consider Redis for production with multiple instances

### Limit Protection

The DTO enforces `@Max(100)` on limit to prevent:
- Accidental huge queries (`?limit=999999`)
- API abuse
- Memory issues

## Common Patterns

### Filter + Sort + Paginate

```typescript
GET /posts?sector=IT&sort=dateDesc&page=1&limit=20
```

### Search + Filter

```typescript
GET /posts?searchQuery=react&type=Télétravail&page=1
```

### Location + Salary

```typescript
GET /posts?city=Lyon&radiusKm=30&minSalary=2500
```