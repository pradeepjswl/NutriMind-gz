'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Camera,
  Upload,
  Barcode,
  Loader2,
  CheckCircle2,
  X,
  ImageIcon,
  ScanLine,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MealAnalysis } from '@/lib/types'

const MEAL_CATEGORIES = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snack' },
]

export default function ScanPage() {
  const router = useRouter()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [activeTab, setActiveTab] = useState('camera')
  const [category, setCategory] = useState('snack')
  const [isCapturing, setIsCapturing] = useState(false)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<MealAnalysis | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [barcode, setBarcode] = useState('')
  const [barcodeProduct, setBarcodeProduct] = useState<Record<string, unknown> | null>(null)

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setCameraStream(stream)
        setIsCapturing(true)
      }
    } catch {
      setError('Could not access camera. Please allow camera permissions.')
    }
  }, [])

  // Stop camera
  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop())
      setCameraStream(null)
      setIsCapturing(false)
    }
  }, [cameraStream])

  // Capture photo from camera
  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(video, 0, 0)
        const imageData = canvas.toDataURL('image/jpeg', 0.8)
        setCapturedImage(imageData)
        stopCamera()
      }
    }
  }, [stopCamera])

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setCapturedImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Analyze meal image
  const analyzeMeal = async () => {
    if (!capturedImage) return

    setIsAnalyzing(true)
    setError(null)

    try {
      const response = await fetch('/api/scan-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: capturedImage,
          category,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to analyze meal')
      }

      const data = await response.json()
      setAnalysis(data.analysis)
    } catch {
      setError('Failed to analyze meal. Please try again.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Lookup barcode
  const lookupBarcode = async () => {
    if (!barcode.trim()) return

    setIsAnalyzing(true)
    setError(null)
    setBarcodeProduct(null)

    try {
      const response = await fetch(`/api/barcode?barcode=${encodeURIComponent(barcode)}`)
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Product not found')
        }
        throw new Error('Failed to lookup barcode')
      }

      const data = await response.json()
      setBarcodeProduct(data.product)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to lookup barcode')
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Save barcode product
  const saveBarcodeProduct = async () => {
    if (!barcodeProduct) return

    setIsAnalyzing(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      await supabase.from('meal_logs').insert({
        user_id: user.id,
        name: barcodeProduct.name as string,
        emoji: '📦',
        category,
        calories: barcodeProduct.calories as number,
        protein: barcodeProduct.protein as number,
        carbs: barcodeProduct.carbs as number,
        fat: barcodeProduct.fat as number,
        fiber: barcodeProduct.fiber as number,
        health_score: barcodeProduct.health_score as string,
      })

      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('Failed to save meal')
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Reset state
  const reset = () => {
    setCapturedImage(null)
    setAnalysis(null)
    setBarcodeProduct(null)
    setError(null)
    setBarcode('')
    stopCamera()
  }

  return (
    <div className="px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Scan Meal</h1>
        <p className="text-sm text-muted-foreground">
          Take a photo or scan a barcode to log your meal
        </p>
      </div>

      {/* Category selector */}
      <div className="mb-4">
        <Field>
          <FieldLabel>Meal Category</FieldLabel>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MEAL_CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="camera" className="gap-2">
            <Camera className="h-4 w-4" />
            Camera
          </TabsTrigger>
          <TabsTrigger value="upload" className="gap-2">
            <Upload className="h-4 w-4" />
            Upload
          </TabsTrigger>
          <TabsTrigger value="barcode" className="gap-2">
            <Barcode className="h-4 w-4" />
            Barcode
          </TabsTrigger>
        </TabsList>

        {/* Camera Tab */}
        <TabsContent value="camera" className="mt-4">
          <Card>
            <CardContent className="p-4">
              {!capturedImage && !analysis ? (
                <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted">
                  {isCapturing ? (
                    <>
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="h-full w-full object-cover"
                      />
                      <Button
                        onClick={capturePhoto}
                        size="lg"
                        className="absolute bottom-4 left-1/2 -translate-x-1/2 gap-2 rounded-full bg-white text-foreground shadow-lg hover:bg-gray-100"
                      >
                        <Camera className="h-5 w-5" />
                        Capture
                      </Button>
                    </>
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-4">
                      <Camera className="h-16 w-16 text-muted-foreground" />
                      <Button onClick={startCamera} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                        <Camera className="h-4 w-4" />
                        Start Camera
                      </Button>
                    </div>
                  )}
                </div>
              ) : capturedImage && !analysis ? (
                <div className="space-y-4">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-xl">
                    <img
                      src={capturedImage}
                      alt="Captured meal"
                      className="h-full w-full object-cover"
                    />
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute right-2 top-2"
                      onClick={reset}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button
                    onClick={analyzeMeal}
                    disabled={isAnalyzing}
                    className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <ScanLine className="h-4 w-4" />
                        Analyze Meal
                      </>
                    )}
                  </Button>
                </div>
              ) : null}
              <canvas ref={canvasRef} className="hidden" />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Upload Tab */}
        <TabsContent value="upload" className="mt-4">
          <Card>
            <CardContent className="p-4">
              {!capturedImage && !analysis ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-muted-foreground/30 bg-muted/50 transition-colors hover:border-emerald-500 hover:bg-emerald-50"
                >
                  <ImageIcon className="h-16 w-16 text-muted-foreground" />
                  <div className="text-center">
                    <p className="font-medium">Click to upload</p>
                    <p className="text-sm text-muted-foreground">or drag and drop</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              ) : capturedImage && !analysis ? (
                <div className="space-y-4">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-xl">
                    <img
                      src={capturedImage}
                      alt="Uploaded meal"
                      className="h-full w-full object-cover"
                    />
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute right-2 top-2"
                      onClick={reset}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button
                    onClick={analyzeMeal}
                    disabled={isAnalyzing}
                    className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <ScanLine className="h-4 w-4" />
                        Analyze Meal
                      </>
                    )}
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Barcode Tab */}
        <TabsContent value="barcode" className="mt-4">
          <Card>
            <CardContent className="space-y-4 p-4">
              <Field>
                <FieldLabel>Enter Barcode</FieldLabel>
                <div className="flex gap-2">
                  <Input
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    placeholder="e.g., 5901234123457"
                    onKeyDown={(e) => e.key === 'Enter' && lookupBarcode()}
                  />
                  <Button
                    onClick={lookupBarcode}
                    disabled={isAnalyzing || !barcode.trim()}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Lookup'}
                  </Button>
                </div>
              </Field>

              {barcodeProduct && (
                <div className="space-y-4 rounded-xl bg-muted/50 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{barcodeProduct.name as string}</h3>
                      {barcodeProduct.brand && (
                        <p className="text-sm text-muted-foreground">{barcodeProduct.brand as string}</p>
                      )}
                    </div>
                    {barcodeProduct.health_score && (
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-xs font-bold',
                          barcodeProduct.health_score === 'A' && 'bg-emerald-100 text-emerald-700',
                          barcodeProduct.health_score === 'B' && 'bg-green-100 text-green-700',
                          barcodeProduct.health_score === 'C' && 'bg-yellow-100 text-yellow-700',
                          barcodeProduct.health_score === 'D' && 'bg-orange-100 text-orange-700',
                          barcodeProduct.health_score === 'F' && 'bg-red-100 text-red-700'
                        )}
                      >
                        {barcodeProduct.health_score as string}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="rounded-lg bg-white p-2">
                      <div className="text-lg font-bold">{barcodeProduct.calories as number}</div>
                      <div className="text-xs text-muted-foreground">kcal</div>
                    </div>
                    <div className="rounded-lg bg-white p-2">
                      <div className="text-lg font-bold text-blue-600">{barcodeProduct.protein as number}g</div>
                      <div className="text-xs text-muted-foreground">Protein</div>
                    </div>
                    <div className="rounded-lg bg-white p-2">
                      <div className="text-lg font-bold text-orange-600">{barcodeProduct.carbs as number}g</div>
                      <div className="text-xs text-muted-foreground">Carbs</div>
                    </div>
                    <div className="rounded-lg bg-white p-2">
                      <div className="text-lg font-bold text-purple-600">{barcodeProduct.fat as number}g</div>
                      <div className="text-xs text-muted-foreground">Fat</div>
                    </div>
                  </div>

                  <Button
                    onClick={saveBarcodeProduct}
                    disabled={isAnalyzing}
                    className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700"
                  >
                    {isAnalyzing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Add to Log
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Analysis Result */}
      {analysis && (
        <Card className="mt-4">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">{analysis.emoji}</span>
              {analysis.name}
              <span
                className={cn(
                  'ml-auto rounded-full px-2 py-0.5 text-xs font-bold',
                  analysis.health_score === 'A' && 'bg-emerald-100 text-emerald-700',
                  analysis.health_score === 'B' && 'bg-green-100 text-green-700',
                  analysis.health_score === 'C' && 'bg-yellow-100 text-yellow-700',
                  analysis.health_score === 'D' && 'bg-orange-100 text-orange-700',
                  analysis.health_score === 'F' && 'bg-red-100 text-red-700'
                )}
              >
                {analysis.health_score}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="rounded-lg bg-emerald-50 p-3">
                <div className="text-xl font-bold text-emerald-700">{analysis.calories}</div>
                <div className="text-xs text-muted-foreground">kcal</div>
              </div>
              <div className="rounded-lg bg-blue-50 p-3">
                <div className="text-xl font-bold text-blue-600">{analysis.protein}g</div>
                <div className="text-xs text-muted-foreground">Protein</div>
              </div>
              <div className="rounded-lg bg-orange-50 p-3">
                <div className="text-xl font-bold text-orange-600">{analysis.carbs}g</div>
                <div className="text-xs text-muted-foreground">Carbs</div>
              </div>
              <div className="rounded-lg bg-purple-50 p-3">
                <div className="text-xl font-bold text-purple-600">{analysis.fat}g</div>
                <div className="text-xs text-muted-foreground">Fat</div>
              </div>
            </div>

            {analysis.suggestions && analysis.suggestions.length > 0 && (
              <div className="rounded-lg bg-blue-50 p-3">
                <p className="mb-2 text-sm font-medium text-blue-800">Tips to make it healthier:</p>
                <ul className="space-y-1 text-sm text-blue-700">
                  {analysis.suggestions.map((tip, i) => (
                    <li key={i}>- {tip}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={reset} className="flex-1">
                Scan Another
              </Button>
              <Button
                onClick={() => {
                  router.push('/dashboard')
                  router.refresh()
                }}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Done
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error display */}
      {error && (
        <div className="mt-4 rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
          {error}
          <Button variant="link" onClick={reset} className="ml-2 h-auto p-0 text-destructive">
            Try again
          </Button>
        </div>
      )}
    </div>
  )
}
