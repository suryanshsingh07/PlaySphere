# Firestore Collections & Security Database Guide

This document describes the schema, roles, and querying patterns of the Firebase Firestore collections in **PlaySphere AI**.

---

## 🏛️ Firestore Schema Overview

The database is composed of three primary collections: `users`, `venues`, and `bookings`.

```
playsphere-ai/ (database root)
├── users/ (Collection)
│   └── {uid} (Document: UserProfile)
│
├── venues/ (Collection)
│   └── {venueId} (Document: Venue)
│
└── bookings/ (Collection)
    └── {bookingId} (Document: Booking)
```

---

## 🗄️ 1. Users Collection (`/users/{uid}`)

Stores account metadata and roles for authentication and authorization.

### Schema Fields
| Field Name | Type | Description |
| :--- | :--- | :--- |
| `uid` | `string` | Unique identifier matching Firebase Auth UID. |
| `email` | `string` | User's email address. |
| `name` | `string` | User's displayed full name. |
| `role` | `'player' \| 'owner' \| 'admin'` | System access permission tier. |
| `approvalStatus` | `'pending' \| 'approved' \| 'rejected'` | Owner verification state (only relevant if role = `'owner'`). |
| `savedVenues` | `string[]` | Array of `{venueId}` references representing the user's bookmarked venues. |
| `createdAt` | `Timestamp` | Registration timestamp. |

---

## 🏸 2. Venues Collection (`/venues/{venueId}`)

Stores information about sports venues located in Lucknow.

### Schema Fields
| Field Name | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Document ID. |
| `ownerId` | `string` | UID of the facility owner who listed this venue. |
| `name` | `string` | Name of the venue. |
| `sport` | `'badminton' \| 'football' \| 'swimming' \| 'akhara'` | Sport type. |
| `area` | `string` | Location area (e.g. Gomti Nagar, Aliganj, Hazratganj). |
| `address` | `string` | Full physical address. |
| `price` | `number` | Flat hourly rate in INR (₹). |
| `rating` | `number` | Rating score from `1.0` to `5.0`. |
| `skillLevel` | `'beginner' \| 'intermediate' \| 'advanced' \| 'all'` | Skill recommendation badge. |
| `amenities` | `string[]` | Available amenities (e.g. Parking, Shower, Power Backup, Drinking Water). |
| `available` | `boolean` | Flag indicating if the venue is currently active and listable. |
| `description` | `string` | Description of the venue. |
| `timings` | `object` | Hours of operation: `{ open: string, close: string }` (e.g. `{ open: "06:00", close: "22:00" }`). |
| `coordinates` | `object` | Location coordinates: `{ lat: number, lng: number }`. |
| `createdAt` | `Timestamp` | Date of registration. |

---

## 🎟️ 3. Bookings Collection (`/bookings/{bookingId}`)

Tracks venue slot bookings by players.

### Schema Fields
| Field Name | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Document ID. |
| `venueId` | `string` | Target venue ID. |
| `venueName` | `string` | Snapshot of the venue's name at the time of booking. |
| `userId` | `string` | Player UID who placed the booking. |
| `userName` | `string` | Player's display name. |
| `date` | `string` | ISO Date string (`YYYY-MM-DD`). |
| `slot` | `string` | Booking slot time range (e.g., `"07:00 - 08:00"`). |
| `pricePaid` | `number` | Total price paid after applying slot modifiers. |
| `status` | `'confirmed' \| 'cancelled'` | Current state of the reservation. |
| `sport` | `string` | Sport category. |
| `ticketNumber` | `string` | Unique booking ticket serial (e.g., `PS-BAD-A28F9`). |
| `createdAt` | `Timestamp` | Time of slot booking. |

---

## 🔏 4. Security Rules Configuration (`firestore.rules`)

The security rules define how data can be queried safely:
1. **User Profiles**: Users can read/write their own user profile document. Only admins can read all profiles or change an owner's `approvalStatus`.
2. **Venues**: Read access is public for approved/available venues. Creating or editing a venue is restricted to owners (who must own the venue document) or admins.
3. **Bookings**: Players can read/write bookings where `userId == request.auth.uid`. Venue owners can read bookings that match their owned `venueId` references. Admins have global read/write access.
