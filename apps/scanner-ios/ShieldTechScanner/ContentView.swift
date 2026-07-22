// Start screen + multi-room list + export. LiDAR availability is checked up
// front so non-LiDAR devices get a clear message instead of a broken scan.
import SwiftUI
import RoomPlan

struct ContentView: View {
    @EnvironmentObject var session: ScanSession
    @State private var scanning = false
    @State private var showShare = false

    private var lidarOK: Bool { RoomCaptureSession.isSupported }

    var body: some View {
        NavigationStack {
            Form {
                Section("Job") {
                    TextField("Customer", text: $session.customer)
                    TextField("Site / building", text: $session.site)
                }

                Section("Rooms scanned this visit") {
                    if session.rooms.isEmpty {
                        Text("No rooms yet — tap Scan a Room to start.")
                            .foregroundStyle(.secondary).font(.callout)
                    }
                    ForEach(session.rooms) { r in
                        HStack {
                            Image(systemName: "square.split.bottomrightquarter")
                                .foregroundStyle(.blue)
                            VStack(alignment: .leading) {
                                Text(r.name).font(.headline)
                                Text("\(r.wallCount) walls · \(r.objectCount) objects · \(Int(r.areaFt2)) ft²")
                                    .font(.caption).foregroundStyle(.secondary)
                            }
                        }
                    }
                    .onDelete { idx in session.rooms.remove(atOffsets: idx) }
                }

                Section {
                    Button {
                        scanning = true
                    } label: {
                        Label(session.rooms.isEmpty ? "Scan a Room (LiDAR)" : "Scan Another Room", systemImage: "viewfinder")
                    }
                    .disabled(!lidarOK)

                    if !session.rooms.isEmpty {
                        Button {
                            if let url = Exporter.write(session: session) {
                                session.lastExportURL = url
                                showShare = true
                            }
                        } label: {
                            Label("Send \(session.rooms.count) room(s) to ShieldTech", systemImage: "square.and.arrow.up")
                        }
                    }
                }

                if !lidarOK {
                    Section {
                        Text("This device has no LiDAR sensor. RoomPlan needs an iPhone 12 Pro (or newer Pro) or an iPad Pro 2020+.")
                            .font(.footnote).foregroundStyle(.orange)
                    }
                }

                Section("How it works") {
                    Text("Walk the room slowly. Walls, ceiling height, doors, windows and furniture build live in 3D and stay locked in place as you move. Tap Done when the room is closed. Repeat for each room, then send the whole visit to the portal — it lands under Survey Scan → Import.")
                        .font(.footnote).foregroundStyle(.secondary)
                }
            }
            .navigationTitle("ShieldTech Scanner")
            .fullScreenCover(isPresented: $scanning) {
                RoomScanView { room in
                    if let room = room { session.rooms.append(room) }
                    scanning = false
                }
                .ignoresSafeArea()
            }
            .sheet(isPresented: $showShare) {
                if let url = session.lastExportURL { ShareSheet(items: [url]) }
            }
        }
    }
}

/// UIKit share sheet bridge (AirDrop / Files / Mail → into the platform).
struct ShareSheet: UIViewControllerRepresentable {
    let items: [Any]
    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: items, applicationActivities: nil)
    }
    func updateUIViewController(_ vc: UIActivityViewController, context: Context) {}
}
