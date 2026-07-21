# ShieldTech Scanner (iOS · LiDAR)

Native companion app that gives the platform **true LiDAR scanning** via Apple
RoomPlan: walls, ceiling height, doors, windows and furniture, all with real
measured dimensions. Browsers cannot access the LiDAR sensor — this app is the
bridge, and it is intentionally tiny (2 Swift files).

## How the loop works
1. Tech opens ShieldTech Scanner on any LiDAR iPhone/iPad (Pro models, iOS 16+),
   enters customer/site, walks the room.
2. RoomPlan builds the parametric room; "Finish Scan" exports
   `shieldtech-scan-*.json` (+ a USDZ 3D model).
3. Share/AirDrop the JSON to any device → open the portal → Survey Scan →
   **⌁ Import LiDAR Scan** → the scan becomes a full Survey project (rooms,
   openings, objects with dimensions) and syncs across the whole platform.

## Build & install
1. Xcode 15+ on a Mac → File → New → Project → iOS App (SwiftUI), name
   `ShieldTechScanner`, bundle id `com.shieldtechsolutions.scanner`.
2. Replace the generated `ShieldTechScannerApp.swift` with the two files in
   `ShieldTechScanner/`.
3. Target settings: iOS 16.0+, add `NSCameraUsageDescription`
   ("Scans rooms with LiDAR for site surveys") to Info.plist.
4. Sign with your Apple Developer team → run on a LiDAR device.
5. Distribute to the team via TestFlight (no public App Store review needed
   for internal testers).

## Requirements
- Apple Developer Program membership ($99/yr) — listed in OUTSTANDING-APIS.md
- LiDAR-equipped device: iPhone 12 Pro+ / iPad Pro 2020+
