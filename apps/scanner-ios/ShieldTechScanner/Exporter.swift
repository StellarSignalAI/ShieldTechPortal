// Exporter — packages the visit (customer/site + all scanned rooms) into a
// single JSON the ShieldTech platform imports. The web importer
// (packages/shared/lidar-import.js) accepts either a single {capturedRoom}
// wrapper or this {rooms:[...]} multi-room envelope.
import Foundation

enum Exporter {
    static func write(session: ScanSession) -> URL? {
        // Each room's `json` is an encoded RoomPlan CapturedRoom; embed raw.
        var roomObjs: [[String: Any]] = []
        for r in session.rooms {
            if let obj = try? JSONSerialization.jsonObject(with: r.json) {
                roomObjs.append(["name": r.name, "capturedRoom": obj])
            }
        }
        let envelope: [String: Any] = [
            "source": "shieldtech-scanner-ios",
            "customer": session.customer,
            "site": session.site,
            "capturedAt": ISO8601DateFormatter().string(from: Date()),
            // Single-room convenience field (first room) for the simple importer path…
            "capturedRoom": roomObjs.first?["capturedRoom"] ?? [:],
            // …and the full multi-room set.
            "rooms": roomObjs,
        ]
        guard let data = try? JSONSerialization.data(withJSONObject: envelope, options: [.prettyPrinted]) else { return nil }
        let name = "shieldtech-scan-\(Int(Date().timeIntervalSince1970)).json"
        let url = FileManager.default.temporaryDirectory.appendingPathComponent(name)
        do { try data.write(to: url); return url } catch { return nil }
    }
}
