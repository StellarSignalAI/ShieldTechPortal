# ShieldTech Scanner (iOS · LiDAR)

The **real** LiDAR scanner for the platform. Uses Apple **RoomPlan**: as the tech
walks a space, walls, ceiling height, doors, windows and furniture build **live
in 3D and stay world-locked** in the camera view — exactly like MagicPlan.
Every capture has **true measured dimensions**. Multi-room per visit, then one
tap sends the whole job into the portal.

Browsers cannot access the LiDAR sensor (Apple restricts it to native apps, and
iOS Safari has no WebXR), so this native app is the bridge. The web Survey Scan
is a camera+AI *estimate* only; this app is the survey-grade path.

## Files
- `ShieldTechScannerApp.swift` — app entry + `ScanSession` (customer/site + rooms)
- `ContentView.swift` — job form, scanned-room list, "Send to ShieldTech"
- `RoomScanView.swift` — live `RoomCaptureView` (real-time LiDAR, coaching, Done)
- `Exporter.swift` — packages the visit as JSON the platform imports

## The loop
1. Tech opens ShieldTech Scanner on a LiDAR iPhone/iPad, enters customer + site.
2. **Scan a Room** → walk the space; the room reconstructs live in 3D. **Done**.
3. Repeat for each room (they collect under the visit).
4. **Send to ShieldTech** → share/AirDrop the `.json` → open the portal →
   Survey Scan → **⌁ Import LiDAR Scan** → a full multi-room Survey project
   (measured walls, ceilings, doors, windows, furniture) appears and syncs.

## Build & install (one-time)
1. Xcode 15+ on a Mac → New → iOS App (SwiftUI), name **ShieldTechScanner**,
   bundle id `com.shieldtechsolutions.scanner`, **iOS 16.0+**.
2. Replace the generated files with the four `.swift` files in
   `ShieldTechScanner/`. Add **RoomPlan** — it's a system framework, no package
   needed; just `import RoomPlan`.
3. Info.plist → add **NSCameraUsageDescription**:
   "Scans rooms with LiDAR for site surveys."
4. Signing → your Apple Developer team → run on a **LiDAR device**
   (iPhone 12 Pro or newer Pro; iPad Pro 2020+).
5. Distribute to techs via **TestFlight** (internal testers, no App Store review).

## Requirements
- Apple Developer Program ($99/yr) — see OUTSTANDING-APIS.md §8
- LiDAR device for scanning (any recent iPhone can *receive* the shared file and
  import it in the browser, but only LiDAR devices can scan)
