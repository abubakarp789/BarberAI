# Security Specification Phase 0

## Data Invariants
1. Users can only exist if authenticated.
2. A Barber profile `barbers/{uid}` must match the `request.auth.uid`.
3. Customers can modify their own bookings `bookings/{bookingId}` or create them.
4. Barbers can update `bookings/{bookingId}` to status `confirmed`, `completed` or `cancelled` ONLY if `barberId == request.auth.uid`.
5. Only completed bookings can have reviews created by the associated customer.
6. A review cannot be edited after creation.

## The Dirty Dozen Payloads
1. Create user document with someone else's UID in path.
2. Update user role as a non-admin.
3. Barber trying to update someone else's barber profile.
4. Booking creation with negative service price.
5. Customer changing the booking's `barberId`.
6. Barber modifying the `customerId` of a booking.
7. Customer review on an uncompleted booking.
8. Customer reviewing another customer's booking.
9. Barber creating a review for themselves.
10. Update booking status to an invalid value (e.g., 'deleted').
11. PII exposure: Customer reading other customer's user profile.
12. ID poisoning: Creating document with huge ID string.

## The Test Runner
(Will be implemented in `firestore.rules.test.ts`)
