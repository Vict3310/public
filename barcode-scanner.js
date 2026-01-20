// Barcode Scanner Module
class BarcodeScanner {
    constructor() {
        this.isScanning = false;
        this.stream = null;
    }

    async startScanner(callback) {
        if (this.isScanning) return;
        
        try {
            // Request camera permission
            this.stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment' } 
            });
            
            // Create scanner modal
            this.createScannerModal();
            
            const video = document.getElementById('scannerVideo');
            video.srcObject = this.stream;
            
            this.isScanning = true;
            
            // Simple barcode detection (mock for now - in production use QuaggaJS)
            this.mockBarcodeDetection(callback);
            
        } catch (error) {
            console.error('Camera access denied:', error);
            showNotification('Camera access required for barcode scanning', 'error');
        }
    }

    createScannerModal() {
        const modal = document.createElement('div');
        modal.id = 'scannerModal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 400px;">
                <div class="modal-header">
                    <h3>Scan Barcode</h3>
                    <button type="button" id="closeScannerModal">&times;</button>
                </div>
                <div class="modal-body">
                    <video id="scannerVideo" autoplay style="width: 100%; border-radius: 8px;"></video>
                    <p style="text-align: center; margin-top: 10px;">Position barcode in camera view</p>
                    <button id="manualBarcodeBtn" class="btn btn-secondary" style="width: 100%; margin-top: 10px;">
                        Enter Manually
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        document.getElementById('closeScannerModal').onclick = () => this.stopScanner();
        document.getElementById('manualBarcodeBtn').onclick = () => {
            const barcode = prompt('Enter barcode manually:');
            if (barcode) {
                document.getElementById('barcode').value = barcode;
                this.stopScanner();
            }
        };
    }

    mockBarcodeDetection(callback) {
        // Simulate barcode detection after 3 seconds
        setTimeout(() => {
            const mockBarcode = '123456789012';
            callback(mockBarcode);
            this.stopScanner();
            showNotification('Barcode detected: ' + mockBarcode, 'success');
        }, 3000);
    }

    stopScanner() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        
        const modal = document.getElementById('scannerModal');
        if (modal) modal.remove();
        
        this.isScanning = false;
    }
}

window.barcodeScanner = new BarcodeScanner();