import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, IScannerControls } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Loader2, ScanLine, Camera, X, Barcode } from "lucide-react";

const MEALS = ["breakfast", "lunch", "dinner", "snack"] as const;

type OffProduct = {
  code: string;
  name: string;
  brand?: string;
  imageUrl?: string;
  per100g: { calories: number; protein: number; carbs: number; fat: number };
};

function parseProduct(json: any): OffProduct | null {
  if (!json || json.status !== 1 || !json.product) return null;
  const p = json.product;
  const n = p.nutriments ?? {};
  const kcal =
    Number(n["energy-kcal_100g"]) ||
    (Number(n["energy_100g"]) ? Math.round(Number(n["energy_100g"]) / 4.184) : 0);
  return {
    code: json.code,
    name: p.product_name || p.generic_name || "Unknown product",
    brand: p.brands,
    imageUrl: p.image_small_url || p.image_thumb_url,
    per100g: {
      calories: Math.round(kcal || 0),
      protein: Math.round((Number(n.proteins_100g) || 0) * 10) / 10,
      carbs: Math.round((Number(n.carbohydrates_100g) || 0) * 10) / 10,
      fat: Math.round((Number(n.fat_100g) || 0) * 10) / 10,
    },
  };
}

export default function BarcodeScanner({ date, onLogged }: { date: string; onLogged?: () => void }) {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [manual, setManual] = useState("");
  const [product, setProduct] = useState<OffProduct | null>(null);
  const [grams, setGrams] = useState(100);
  const [meal, setMeal] = useState<(typeof MEALS)[number]>("snack");
  const [logging, setLogging] = useState(false);

  useEffect(() => {
    return () => {
      controlsRef.current?.stop();
      controlsRef.current = null;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  const stopScan = () => {
    controlsRef.current?.stop();
    controlsRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setScanning(false);
  };

  const startScan = async () => {
    setProduct(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error("Camera not supported on this browser");
      return;
    }
    if (!window.isSecureContext) {
      toast.error("Camera requires a secure (https) connection");
      return;
    }
    setScanning(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;

      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.UPC_A,
        BarcodeFormat.UPC_E,
        BarcodeFormat.CODE_128,
        BarcodeFormat.CODE_39,
        BarcodeFormat.ITF,
      ]);
      hints.set(DecodeHintType.TRY_HARDER, true);
      const reader = new BrowserMultiFormatReader(hints, { delayBetweenScanAttempts: 150 });

      // wait a tick so the <video> element is mounted
      await new Promise((r) => setTimeout(r, 0));
      if (!videoRef.current) throw new Error("Camera view not ready");

      const controls = await reader.decodeFromStream(stream, videoRef.current, (result) => {
        if (result) {
          const code = result.getText();
          stopScan();
          lookup(code);
        }
      });
      controlsRef.current = controls;
    } catch (err: any) {
      stopScan();
      const name = err?.name;
      toast.error(
        name === "NotAllowedError"
          ? "Camera permission denied — allow camera access and try again"
          : name === "NotFoundError"
            ? "No camera found on this device"
            : err?.message || "Could not start camera",
      );
    }
  };

  const lookup = async (barcode: string) => {
    const code = barcode.trim();
    if (!code) return;
    setLoading(true);
    setProduct(null);
    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(code)}.json`);
      const json = await res.json();
      const p = parseProduct(json);
      if (!p) {
        toast.error(`No product found for ${code}`);
      } else {
        setProduct(p);
        setGrams(100);
      }
    } catch (err: any) {
      toast.error(err?.message || "Lookup failed");
    } finally {
      setLoading(false);
    }
  };

  const logFood = async () => {
    if (!user || !product) return;
    if (grams <= 0 || grams > 5000) return toast.error("Serving must be 1-5000g");
    const factor = grams / 100;
    const macros = {
      calories: Math.round(product.per100g.calories * factor),
      protein: Math.round(product.per100g.protein * factor * 10) / 10,
      carbs: Math.round(product.per100g.carbs * factor * 10) / 10,
      fat: Math.round(product.per100g.fat * factor * 10) / 10,
    };
    setLogging(true);
    const { error } = await supabase.from("food_logs").insert({
      user_id: user.id,
      food_name: product.name.slice(0, 120),
      meal_type: meal,
      portion_grams: grams,
      logged_at: date,
      ...macros,
    });
    setLogging(false);
    if (error) return toast.error(error.message);
    toast.success(`Logged ${product.name.slice(0, 40)} · ${macros.calories} kcal`);
    setProduct(null);
    onLogged?.();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Barcode className="h-4 w-4 text-primary" /> Barcode Scanner
      </div>

      {!scanning ? (
        <Button type="button" onClick={startScan} variant="secondary" className="w-full">
          <Camera className="h-4 w-4 mr-1" /> Start camera scan
        </Button>
      ) : (
        <div className="space-y-2">
          <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
            <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <ScanLine className="h-16 w-16 text-primary/70 animate-pulse" />
            </div>
          </div>
          <Button type="button" onClick={stopScan} variant="outline" className="w-full">
            <X className="h-4 w-4 mr-1" /> Stop
          </Button>
        </div>
      )}

      <form
        onSubmit={(e) => { e.preventDefault(); lookup(manual); }}
        className="flex gap-2"
      >
        <Input
          placeholder="Enter barcode manually"
          value={manual}
          onChange={(e) => setManual(e.target.value)}
          inputMode="numeric"
          maxLength={20}
        />
        <Button type="submit" disabled={loading || !manual.trim()}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Lookup"}
        </Button>
      </form>

      {loading && (
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Looking up product…
        </div>
      )}

      {product && (
        <div className="glass-surface p-3 space-y-3">
          <div className="flex gap-3">
            {product.imageUrl && (
              <img src={product.imageUrl} alt={product.name} className="h-16 w-16 rounded-md object-cover bg-secondary" />
            )}
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm leading-tight">{product.name}</div>
              {product.brand && <div className="text-xs text-muted-foreground truncate">{product.brand}</div>}
              <div className="text-[10px] text-muted-foreground mt-1">Barcode: {product.code}</div>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-1 text-center text-xs bg-secondary/50 rounded-md p-2">
            <div><div className="font-semibold text-sm">{product.per100g.calories}</div><div className="text-muted-foreground">kcal</div></div>
            <div><div className="font-semibold text-sm">{product.per100g.protein}g</div><div className="text-muted-foreground">protein</div></div>
            <div><div className="font-semibold text-sm">{product.per100g.carbs}g</div><div className="text-muted-foreground">carbs</div></div>
            <div><div className="font-semibold text-sm">{product.per100g.fat}g</div><div className="text-muted-foreground">fat</div></div>
          </div>
          <div className="text-[10px] text-muted-foreground -mt-1">Per 100g</div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Serving (g)</Label>
              <Input
                type="number"
                min={1}
                max={5000}
                value={grams}
                onChange={(e) => setGrams(Number(e.target.value))}
              />
            </div>
            <div>
              <Label className="text-xs">Meal</Label>
              <Select value={meal} onValueChange={(v) => setMeal(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MEALS.map((m) => <SelectItem key={m} value={m} className="capitalize">{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            = {Math.round(product.per100g.calories * (grams / 100))} kcal for {grams}g
          </div>

          <Button onClick={logFood} disabled={logging} className="w-full">
            {logging ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4 mr-1" /> Log food</>}
          </Button>
        </div>
      )}
    </div>
  );
}