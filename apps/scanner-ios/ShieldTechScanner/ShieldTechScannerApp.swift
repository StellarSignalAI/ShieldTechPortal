// ShieldTech Scanner — LiDAR room capture (Apple RoomPlan).
// Real-time LiDAR scanning: walls, ceilings, doors, windows and furniture build
// live in the AR view as you walk the space, world-locked in 3D. Exports a
// measured JSON (+ USDZ) that the ShieldTech platform imports as a Survey Scan.
//
// Requires: iOS 16+, a LiDAR device (iPhone 12 Pro+ / iPad Pro 2020+),
// NSCameraUsageDescription in Info.plist, Apple Developer signing.
import SwiftUI

@main
struct ShieldTechScannerApp: App {
    @StateObject private var session = ScanSession()
    var body: some Scene {
        WindowGroup {
            ContentView().environmentObject(session)
        }
    }
}

/// Holds the multi-room capture in progress and the finished export.
final class ScanSession: ObservableObject {
    @Published var customer: String = ""
    @Published var site: String = ""
    @Published var rooms: [ScannedRoom] = []           // completed rooms this visit
    @Published var lastExportURL: URL?

    struct ScannedRoom: Identifiable {
        let id = UUID()
        let name: String
        let json: Data                                 // CapturedRoom JSON
        let wallCount: Int
        let objectCount: Int
        let areaFt2: Double
    }

    func reset() { rooms.removeAll(); lastExportURL = nil }
}
