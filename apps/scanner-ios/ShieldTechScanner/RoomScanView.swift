// Live LiDAR capture screen (Apple RoomPlan RoomCaptureView). Walls, ceiling,
// doors, windows and furniture render and update in real time in the AR view,
// world-locked as the tech walks. "Done" finalizes the parametric room and
// hands back a measured ScannedRoom.
import SwiftUI
import RoomPlan

struct RoomScanView: UIViewControllerRepresentable {
    let onFinish: (ScanSession.ScannedRoom?) -> Void
    func makeUIViewController(context: Context) -> ScanVC {
        let vc = ScanVC(); vc.onFinish = onFinish; return vc
    }
    func updateUIViewController(_ vc: ScanVC, context: Context) {}
}

final class ScanVC: UIViewController, RoomCaptureViewDelegate, RoomCaptureSessionDelegate {
    var onFinish: ((ScanSession.ScannedRoom?) -> Void)?
    private var captureView: RoomCaptureView!
    private var isScanning = false
    private let coach = UILabel()

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .black

        // RoomCaptureView renders the live LiDAR reconstruction (world-locked).
        captureView = RoomCaptureView(frame: view.bounds)
        captureView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        captureView.delegate = self
        captureView.captureSession.delegate = self
        view.addSubview(captureView)

        // Live coaching banner.
        coach.text = "Point at a wall and walk the room slowly…"
        coach.font = .systemFont(ofSize: 14, weight: .semibold)
        coach.textColor = .white
        coach.textAlignment = .center
        coach.backgroundColor = UIColor.black.withAlphaComponent(0.55)
        coach.layer.cornerRadius = 10
        coach.clipsToBounds = true
        coach.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(coach)

        let done = makeButton("■  Done — finish room", color: .systemBlue)
        done.addTarget(self, action: #selector(finish), for: .touchUpInside)
        let cancel = makeButton("Cancel", color: UIColor(white: 0.2, alpha: 0.9))
        cancel.addTarget(self, action: #selector(cancel), for: .touchUpInside)

        let stack = UIStackView(arrangedSubviews: [done, cancel])
        stack.axis = .vertical; stack.spacing = 10
        stack.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(stack)

        NSLayoutConstraint.activate([
            coach.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 12),
            coach.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            coach.heightAnchor.constraint(equalToConstant: 34),
            coach.leadingAnchor.constraint(greaterThanOrEqualTo: view.leadingAnchor, constant: 24),
            stack.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 24),
            stack.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -24),
            stack.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -16),
        ])
        coach.setContentHuggingPriority(.defaultLow, for: .horizontal)
    }

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        startScan()
    }

    private func startScan() {
        guard !isScanning else { return }
        isScanning = true
        var cfg = RoomCaptureSession.Configuration()
        cfg.isCoachingEnabled = true                 // Apple's live "move here" guidance
        captureView.captureSession.run(configuration: cfg)
    }

    @objc private func finish() {
        coach.text = "Finalizing measured room…"
        captureView.captureSession.stop()            // triggers processing → delegate
    }
    @objc private func cancel() {
        captureView.captureSession.stop()
        onFinish?(nil)
    }

    // Present the processed result inside the capture view.
    func captureView(shouldPresent roomDataForProcessing: CapturedRoomData, error: Error?) -> Bool { true }

    // Final parametric room with measured walls/doors/windows/objects.
    func captureView(didPresent processedResult: CapturedRoom, error: Error?) {
        do {
            let encoder = JSONEncoder(); encoder.outputFormatting = [.sortedKeys]
            let json = try encoder.encode(processedResult)
            let walls = processedResult.walls.count
            let objs = processedResult.objects.count
            // Footprint area (m²) from wall extents → ft².
            let xs = processedResult.walls.map { $0.transform.columns.3.x }
            let zs = processedResult.walls.map { $0.transform.columns.3.z }
            let spanX = (xs.max() ?? 0) - (xs.min() ?? 0)
            let spanZ = (zs.max() ?? 0) - (zs.min() ?? 0)
            let areaFt2 = Double(spanX * spanZ) * 10.7639
            let name = "Room \( /* running index filled by session */ Int.random(in: 1...999) )"
            let room = ScanSession.ScannedRoom(name: name, json: json, wallCount: walls, objectCount: objs, areaFt2: max(0, areaFt2))
            onFinish?(room)
        } catch {
            onFinish?(nil)
        }
    }

    private func makeButton(_ title: String, color: UIColor) -> UIButton {
        let b = UIButton(type: .system)
        b.setTitle(title, for: .normal)
        b.setTitleColor(.white, for: .normal)
        b.titleLabel?.font = .systemFont(ofSize: 16, weight: .semibold)
        b.backgroundColor = color
        b.layer.cornerRadius = 12
        b.heightAnchor.constraint(equalToConstant: 50).isActive = true
        return b
    }
}
