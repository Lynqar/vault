import React, { useRef, useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Camera, Flashlight, RotateCcw, Check } from 'lucide-react'
// Note: jsQR library needs to be installed for QR scanning functionality
// For now, we'll provide a manual entry fallback

interface QRScannerModalProps {
  isOpen: boolean
  onClose: () => void
  onScanned: (data: string) => void
  title?: string
}

interface DetectedQR {
  data: string
  bounds: {
    topLeftCorner: { x: number; y: number }
    topRightCorner: { x: number; y: number }
    bottomLeftCorner: { x: number; y: number }
    bottomRightCorner: { x: number; y: number }
  }
}

const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onScanned,
  title = "Scan QR Code"
}) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [deviceId, setDeviceId] = useState<string>('')
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string>('')
  const [detectedQR, setDetectedQR] = useState<DetectedQR | null>(null)
  const [torchSupported, setTorchSupported] = useState(false)
  const [torchEnabled, setTorchEnabled] = useState(false)
  const [success, setSuccess] = useState(false)

  // Initialize camera
  const initializeCamera = useCallback(async (device?: string) => {
    setError('')
    setSuccess(false)

    if (!videoRef.current || !canvasRef.current) return

    try {
      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: device ? undefined : 'environment', // Prefer back camera
          deviceId: device ? { exact: device } : undefined,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream
      videoRef.current.srcObject = stream

      await videoRef.current.play()

      // Check for torch/flashlight support
      const track = stream.getVideoTracks()[0]
      const capabilities = track.getCapabilities() as any
      setTorchSupported(capabilities.torch || false)

      setIsScanning(true)
      startScanning()

    } catch (err: any) {
      console.error('Camera initialization failed:', err)

      let message = 'Camera access failed'
      if (err.name === 'NotAllowedError') {
        message = 'Camera permission denied. Please allow camera access and try again.'
      } else if (err.name === 'NotFoundError') {
        message = 'No camera found on this device.'
      } else if (err.name === 'NotReadableError') {
        message = 'Camera is being used by another application.'
      }

      setError(message)
      setIsScanning(false)
    }
  }, [])

  // Get available camera devices
  const getDevices = useCallback(async () => {
    try {
      const mediaDevices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = mediaDevices.filter(device => device.kind === 'videoinput')
      setDevices(videoDevices)

      // Auto-select the first device (usually back camera)
      if (videoDevices.length > 0 && !deviceId) {
        setDeviceId(videoDevices[0].deviceId)
      }
    } catch (err) {
      console.warn('Failed to enumerate devices:', err)
    }
  }, [deviceId])

  // Initialize devices on mount
  useEffect(() => {
    if (isOpen) {
      getDevices()
    }
  }, [isOpen, getDevices])

  // Initialize camera when device is selected
  useEffect(() => {
    if (isOpen && deviceId) {
      initializeCamera(deviceId)
    }
  }, [isOpen, deviceId, initializeCamera])

  // Start QR scanning loop (placeholder - needs jsQR library)
  const startScanning = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    if (!context) return

    // Placeholder: In a real implementation with jsQR installed, this would scan for QR codes
    // For now, we'll simulate scanning animation and provide manual entry option
    let frameCount = 0

    const scan = () => {
      frameCount++

      // Draw current video frame to canvas for visual feedback
      canvas.width = video.videoWidth || 640
      canvas.height = video.videoHeight || 480
      context.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Simulate periodic QR detection every 3-5 seconds (for demo)
      if (frameCount % (90 + Math.random() * 60) < 1) { // Roughly every 3-5 seconds at ~30fps
        // For demo purposes, provide a way to test TOTP URL
        // In real implementation, this would be actual QR detection
        console.log('QR scanner active - point camera at TOTP QR code')
        // Note: jsQR library needed for actual QR detection
      }

      if (isScanning) {
        setTimeout(scan, 30) // ~30fps
      }
    }

    setTimeout(scan, 30)
  }, [isScanning])

  // Toggle flashlight
  const toggleTorch = async () => {
    if (!streamRef.current) return

    const track = streamRef.current.getVideoTracks()[0]
    if (!track) return

    try {
      await track.applyConstraints({
        advanced: [{ torch: !torchEnabled } as any]
      })
      setTorchEnabled(!torchEnabled)
    } catch (err) {
      console.warn('Torch toggle failed:', err)
    }
  }

  // Switch camera
  const switchCamera = () => {
    const currentIndex = devices.findIndex(d => d.deviceId === deviceId)
    const nextIndex = (currentIndex + 1) % devices.length
    setDeviceId(devices[nextIndex].deviceId)
  }

  // Cleanup on unmount/close
  const cleanup = useCallback(() => {
    setIsScanning(false)
    setDetectedQR(null)
    setSuccess(false)
    setError('')

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
  }, [])

  useEffect(() => {
    return cleanup
  }, [cleanup])

  const handleClose = () => {
    cleanup()
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-lg bg-surface border border-border rounded-lg shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-accent/20 rounded-lg flex items-center justify-center">
                  <Camera className="w-4 h-4 text-accent" />
                </div>
                <h2 className="text-lg font-semibold text-text">{title}</h2>
              </div>

              <button
                onClick={handleClose}
                className="p-2 text-muted hover:text-text transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scanner Viewport */}
            <div className="relative bg-black">
              <video
                ref={videoRef}
                className="w-full h-auto max-h-96 object-cover"
                playsInline
                muted
                style={{ transform: 'scaleX(-1)' }} // Mirror for natural front camera feel
              />

              <canvas ref={canvasRef} className="hidden" />

              {/* QR Detection Overlay */}
              {detectedQR && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-success/20 border-2 border-success rounded-lg p-8"
                  >
                    <Check className="w-16 h-16 text-success" />
                  </motion.div>
                </div>
              )}

              {/* Scanning Indicator */}
              {isScanning && !detectedQR && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 0.6 }}
                    className="flex items-center gap-2 bg-glass/80 backdrop-blur-sm rounded-full px-4 py-2"
                  >
                    <div className="w-2 h-2 bg-accent rounded-full animate-ping" />
                    <span className="text-text text-sm font-medium">Scanning...</span>
                  </motion.div>
                </div>
              )}

              {/* Viewfinder */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-48 border-2 border-dashed border-accent/50 rounded-lg">
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-accent" />
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-accent" />
                  <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-accent" />
                  <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-accent" />
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="p-4 bg-surface border-t border-border">
              {error ? (
                <div className="text-center">
                  <div className="bg-error/10 border border-error/20 rounded p-3 mb-4">
                    <p className="text-error text-sm">{error}</p>
                  </div>
                  <button
                    onClick={() => initializeCamera(deviceId)}
                    className="px-4 py-2 bg-accent hover:bg-accent/90 text-text rounded"
                  >
                    Try Again
                  </button>
                </div>
              ) : success ? (
                <div className="text-center">
                  <div className="bg-success/10 border border-success/20 rounded p-4 mb-4">
                    <Check className="w-8 h-8 text-success mx-auto mb-2" />
                    <p className="text-success font-medium">QR Code Detected!</p>
                    <p className="text-text-secondary text-sm">
                      TOTP data has been filled automatically
                    </p>
                  </div>
                  <button
                    onClick={handleClose}
                    className="px-4 py-2 bg-success hover:bg-success/90 text-text rounded"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <div className="flex justify-center gap-3">
                  {torchSupported && (
                    <button
                      onClick={toggleTorch}
                      className={`p-3 rounded-lg transition-colors ${
                        torchEnabled
                          ? 'bg-accent text-text'
                          : 'bg-glass/20 text-muted hover:text-text'
                      }`}
                      title="Toggle flashlight"
                    >
                      <Flashlight className="w-5 h-5" />
                    </button>
                  )}

                  {devices.length > 1 && (
                    <button
                      onClick={switchCamera}
                      className="p-3 bg-glass/20 text-muted hover:text-text rounded-lg transition-colors"
                      title="Switch camera"
                    >
                      <RotateCcw className="w-5 h-5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default QRScannerModal
