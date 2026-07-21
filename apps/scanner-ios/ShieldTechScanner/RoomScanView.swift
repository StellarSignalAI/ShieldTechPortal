// RoomPlan capture wrapper: live LiDAR scanning UI + JSON export on finish.
import SwiftUI
import RoomPlan

struct RoomScanView: UIViewControllerRepresentable {
    let customer: String
    let site: String
    let onExport: (URL?) -> Void

    func makeUIViewController(context: Context) -> ScanVC {
        let vc = ScanVC()
        vc.customer = customer; vc.site = site; vc.onExport = onExport
        return vc
    }
    func updateUIViewController(_ vc: ScanVC, context: Context) {}
}

final class ScanVC: UIViewController, RoomCaptureViewDelegate, RoomCaptureSessionDelegate {
    var customer = ""; var site = ""
    var onExport: ((URL?) -> Void)?
    private var captureView: RoomCaptureView!
    private var finalRoom: CapturedRoom?

    override func viewDidLoad() {
        super.viewDidLoad()
        captureView = RoomCaptureView(frame: view.bounds)
        captureView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        captureView.delegate = self
        captureView.captureSession.delegate = self
        view.addSubview(captureView)
        navigationItem.rightBarButtonItem = UIBarButtonItem(title: "Done", style: .done, target: self, action: #selector(finish))
        let done = UIButton(type: .system)
        done.setTitle("■ Finish Scan", for: .normal)
        done.backgroundColor = .systemBlue; done.tintColor = .white
        done.layer.cornerRadius = 12
        done.frame = CGRect(x: 40, y: view.bounds.height - 110, width: view.bounds.width - 80, height: 50)
        done.autoresizingMask = [.flexibleTopMargin, .flexibleWidth]
        done.addTarget(self, action: #selector(finish), for: .touchUpInside)
        view.addSubview(done)
        captureView.captureSession.run(configuration: RoomCaptureSession.Configuration())
    }

    @objc private func finish() { captureView.captureSession.stop() }

    // RoomPlan hands back the final parametric room (walls/doors/windows/objects with dimensions)
    func captureView(shouldPresent roomDataForProcessing: CapturedRoomData, error: Error?) -> Bool { true }
    func captureView(didPresent processedResult: CapturedRoom, error: Error?) {
        finalRoom = processedResult
        exportJSON()
    }

    private func exportJSON() {
        guard let room = finalRoom else { onExport?(nil); return }
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted]
        struct Wrapper: Encodable { let customer: String; let site: String; let capturedRoom: CapturedRoom }
        do {
            let data = try encoder.encode(Wrapper(customer: customer, site: site, capturedRoom: room))
            let url = FileManager.default.temporaryDirectory
                .appendingPathComponent("shieldtech-scan-\(Int(Date().timeIntervalSince1970)).json")
            try data.write(to: url)
            // Also export USDZ for 3D reference alongside the JSON.
            let usdz = url.deletingPathExtension().appendingPathExtension("usdz")
            try? room.export(to: usdz)
            DispatchQueue.main.async { self.onExport?(url) }
        } catch {
            DispatchQueue.main.async { self.onExport?(nil) }
        }
    }
}
