// ShieldTech Scanner — LiDAR room capture (Apple RoomPlan).
// Scans walls, ceilings, doors, windows and furniture with true dimensions,
// then exports JSON that the ShieldTech platform imports as a Survey Scan.
import SwiftUI

@main
struct ShieldTechScannerApp: App {
    var body: some Scene {
        WindowGroup { ContentView() }
    }
}

struct ContentView: View {
    @State private var scanning = false
    @State private var exportURL: URL?
    @State private var customer = ""
    @State private var site = ""

    var body: some View {
        NavigationStack {
            VStack(spacing: 16) {
                TextField("Customer", text: $customer).textFieldStyle(.roundedBorder)
                TextField("Site", text: $site).textFieldStyle(.roundedBorder)
                Button("◉ Start LiDAR Scan") { scanning = true }
                    .buttonStyle(.borderedProminent)
                if let url = exportURL {
                    ShareLink(item: url) { Label("Share scan to ShieldTech", systemImage: "square.and.arrow.up") }
                    Text("AirDrop / share this file, then use 'Import LiDAR Scan' in Survey Scan.")
                        .font(.caption).foregroundStyle(.secondary)
                }
            }
            .padding()
            .navigationTitle("ShieldTech Scanner")
            .fullScreenCover(isPresented: $scanning) {
                RoomScanView(customer: customer, site: site) { url in
                    exportURL = url
                    scanning = false
                }
            }
        }
    }
}
