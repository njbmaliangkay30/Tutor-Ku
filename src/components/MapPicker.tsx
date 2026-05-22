import React, { useEffect, useRef, useState } from "react";
import { Compass, AlertCircle, Map as MapIcon, ChevronDown, ChevronUp, Link as LinkIcon } from "lucide-react";

interface MapPickerProps {
  value: string;
  onChange: (newValue: string) => void;
}

export default function MapPicker({ value, onChange }: MapPickerProps) {
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Default coordinate: Jakarta, Indonesia
  const DEFAULT_LAT = -6.200000;
  const DEFAULT_LNG = 106.816666;

  const [lat, setLat] = useState<number>(DEFAULT_LAT);
  const [lng, setLng] = useState<number>(DEFAULT_LNG);
  const [userGps, setUserGps] = useState<{lat: number; lng: number} | null>(null);
  
  const [addressText, setAddressText] = useState<string>("");
  const [reverseGeocoding, setReverseGeocoding] = useState<boolean>(false);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(true);

  // Helper to extract coordinates from standard URLs or direct numbers if present
  const extractCoordinates = (text: string): { lat: number; lng: number } | null => {
    if (!text) return null;

    // Pattern 1: URL query parameter q=lat,lng
    const qRegex = /[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/;
    const qMatch = text.match(qRegex);
    if (qMatch) {
      return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };
    }

    // Pattern 2: URL with @lat,lng
    const atRegex = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
    const atMatch = text.match(atRegex);
    if (atMatch) {
      return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
    }

    // Pattern 3: URL/query parameter ll=lat,lng
    const llRegex = /[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)/;
    const llMatch = text.match(llRegex);
    if (llMatch) {
      return { lat: parseFloat(llMatch[1]), lng: parseFloat(llMatch[2]) };
    }

    // Pattern 4: Google maps geotag coordinate pattern
    const placeRegex = /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/;
    const placeMatch = text.match(placeRegex);
    if (placeMatch) {
      return { lat: parseFloat(placeMatch[1]), lng: parseFloat(placeMatch[2]) };
    }

    // Pattern 5: Direct coords like -6.2000, 106.8166
    const directRegex = /(-?\d+\.\d+),\s*(-?\d+\.\d+)/;
    const directMatch = text.match(directRegex);
    if (directMatch) {
      const parsedLat = parseFloat(directMatch[1]);
      const parsedLng = parseFloat(directMatch[2]);
      if (parsedLat >= -90 && parsedLat <= 90 && parsedLng >= -180 && parsedLng <= 180) {
        return { lat: parsedLat, lng: parsedLng };
      }
    }

    return null;
  };

  // Setup initial values
  useEffect(() => {
    if (value && value.trim() && !addressText) {
      const coords = extractCoordinates(value);
      if (coords) {
        setLat(coords.lat);
        setLng(coords.lng);
      }

      // Cleanup raw formatted description headers to present a neat & edit-friendly textarea
      let rawText = value;
      rawText = rawText
        .replace(/Link Google Maps: https:\/\/www\.google\.com\/maps\?q=-?\d+\.\d+,-?\d+\.\d+/, "")
        .replace(/Nama Tempat \/ Cafe \/ Gedung:/g, "")
        .replace(/Detail Alamat & Patokan:/g, "")
        .replace(/Alamat \/ Detail Lokasi:/g, "")
        .replace(/Lokasi & Detail Pertemuan:/g, "")
        .replace(/Alamat Lengkap:/g, "")
        .replace(/Titik GPS:/g, "")
        .replace(/Link Google Maps:/g, "")
        .trim();

      setAddressText(rawText);
    }
  }, [value]);

  // Save changes directly back to state
  const updateParent = (text: string, currentLat: number, currentLng: number) => {
    // Generate back dynamic coordinates link alongside user description text
    const mapsLink = `https://www.google.com/maps?q=${currentLat.toFixed(6)},${currentLng.toFixed(6)}`;
    const formatted = `Lokasi & Detail Pertemuan: ${text.trim()}
Link Google Maps: ${mapsLink}`;
    onChange(formatted);
  };

  // Handle typing inside the textarea
  const handleTextChange = (val: string) => {
    setAddressText(val);

    // Auto-detect full coordinates or URL links
    const parsedCoords = extractCoordinates(val);
    let nextLat = lat;
    let nextLng = lng;

    if (parsedCoords) {
      nextLat = parsedCoords.lat;
      nextLng = parsedCoords.lng;
      setLat(nextLat);
      setLng(nextLng);

      // Pan leafet map view and marker green pin silently to match
      if (mapRef.current) {
        mapRef.current.setView([nextLat, nextLng], 15);
        if (markerRef.current) {
          markerRef.current.setLatLng([nextLat, nextLng]);
        }
      }
    }

    updateParent(val, nextLat, nextLng);
  };

  // Safe Leaflet reverse geocoding via user interactions
  const performReverseGeocoding = async (latitude: number, longitude: number) => {
    setReverseGeocoding(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
        {
          headers: {
            "Accept-Language": "id,en",
            "User-Agent": "TutorKu-Edu-App"
          }
        }
      );
      if (!response.ok) throw new Error("HTTP error");
      const data = await response.json();
      if (data && data.display_name) {
        const displayName = data.display_name;
        
        // Extract bakery/cafe details
        const addr = data.address || {};
        const autoPlace = addr.bakery || addr.cafe || addr.restaurant || addr.fast_food || addr.bar || addr.mall || addr.building || addr.office || addr.shop || addr.amenity || "";
        const fullAddress = autoPlace ? `${autoPlace}, ${displayName}` : displayName;

        setAddressText(fullAddress);
        updateParent(fullAddress, latitude, longitude);
      }
    } catch (error) {
      console.error("OSM Reverse geocoding error:", error);
    } finally {
      setReverseGeocoding(false);
    }
  };

  // Fetch device geolocation
  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Browser Anda tidak mendukung deteksi lokasi.");
      return;
    }
    
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userLat = pos.coords.latitude;
        const userLng = pos.coords.longitude;
        setLat(userLat);
        setLng(userLng);
        setUserGps({ lat: userLat, lng: userLng });
        setIsLocating(false);
        
        const L = (window as any).L;
        if (mapRef.current) {
          mapRef.current.setView([userLat, userLng], 14);
          if (markerRef.current) {
            markerRef.current.setLatLng([userLat, userLng]);
          }

          if (L) {
            const userIcon = L.divIcon({
              html: `<div class="relative flex items-center justify-center pointer-events-none" style="width: 24px; height: 24px;">
                <div class="absolute w-[24px] h-[24px] bg-blue-500 rounded-full animate-ping opacity-30" style="animation-duration: 1.8s;"></div>
                <div class="relative w-[13px] h-[13px] bg-blue-600 rounded-full border-2 border-white shadow-md"></div>
              </div>`,
              className: "bg-transparent border-none",
              iconSize: [24, 24],
              iconAnchor: [12, 12]
            });

            if (userMarkerRef.current) {
              userMarkerRef.current.setLatLng([userLat, userLng]);
            } else {
              userMarkerRef.current = L.marker([userLat, userLng], { icon: userIcon }).addTo(mapRef.current);
            }
          }
        }
        
        performReverseGeocoding(userLat, userLng);
      },
      (err) => {
        console.error("Geolocation error:", err);
        alert("Gagal mengakses GPS. Pastikan izin lokasi perangkat diaktifkan.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Initialize Leaflet Map
  useEffect(() => {
    const L = (window as any).L;
    if (!L || !containerRef.current || !isOpen) return;

    const timer = setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
        return;
      }

      const map = L.map(containerRef.current, {
        zoomControl: true,
        attributionControl: false,
      }).setView([lat, lng], 14);

      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 20,
      }).addTo(map);

      if (userGps) {
        const userIcon = L.divIcon({
          html: `<div class="relative flex items-center justify-center pointer-events-none" style="width: 24px; height: 24px;">
            <div class="absolute w-[24px] h-[24px] bg-blue-500 rounded-full animate-ping opacity-30" style="animation-duration: 1.8s;"></div>
            <div class="relative w-[13px] h-[13px] bg-blue-600 rounded-full border-2 border-white shadow-md"></div>
          </div>`,
          className: "bg-transparent border-none",
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });
        userMarkerRef.current = L.marker([userGps.lat, userGps.lng], { icon: userIcon }).addTo(map);
      }

      const customPinIcon = L.divIcon({
        html: `<div class="relative -top-10 -left-6 flex flex-col items-center pointer-events-none">
          <div class="bg-black text-lime border border-lime text-[9px] font-bold px-1.5 py-0.5 rounded shadow whitespace-nowrap mb-1">
            Mulai Belajar Disini
          </div>
          <svg class="w-8 h-8 drop-shadow" viewBox="0 0 24 24" fill="none" xmlns="http://www canvas.org/2000/svg">
            <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9C9.5 7.62 10.62 6.5 12 6.5C13.38 6.5 14.5 7.62 14.5 9C14.5 10.38 13.38 11.5 12 11.5Z" fill="#BFFF07" stroke="black" stroke-width="2.5"/>
          </svg>
        </div>`,
        className: "bg-transparent border-none",
        iconSize: [40, 40],
        iconAnchor: [20, 40],
      });

      const marker = L.marker([lat, lng], {
        draggable: true,
        icon: customPinIcon,
      }).addTo(map);

      marker.on("dragend", () => {
        const position = marker.getLatLng();
        setLat(position.lat);
        setLng(position.lng);
        performReverseGeocoding(position.lat, position.lng);
      });

      map.on("click", (e: any) => {
        const { lat, lng } = e.latlng;
        setLat(lat);
        setLng(lng);
        marker.setLatLng([lat, lng]);
        performReverseGeocoding(lat, lng);
      });

      mapRef.current = map;
      markerRef.current = marker;
    }, 150);

    return () => {
      clearTimeout(timer);
    };
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-bg-1 p-3.5 transition-shadow shadow-sm">
      {/* Header section with toggle option */}
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-extrabold text-lime uppercase tracking-[0.08em] font-mono flex items-center gap-1.5">
          <MapIcon size={12} className="animate-pulse" />
          <span>Interactive Maps & Pin Koordinat</span>
        </label>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="text-text-sub hover:text-text-main flex items-center gap-1 text-[10px] uppercase font-mono tracking-wider font-semibold"
        >
          {isOpen ? (
            <>
              Sembunyikan Peta <ChevronUp size={12} />
            </>
          ) : (
            <>
              Tampilkan Peta <ChevronDown size={12} />
            </>
          )}
        </button>
      </div>

      {isOpen && (
        <div className="flex flex-col gap-3 animate-pgIn">
          {/* Map picker div container element inside styling */}
          <div className="relative w-full h-[220px] rounded-lg border border-border overflow-hidden bg-bg-2 z-10 shadow-inner">
            <div ref={containerRef} className="w-full h-full" style={{ outline: "none" }} />
          </div>

          {/* GPS Accuracy Button */}
          <button
            type="button"
            onClick={handleCurrentLocation}
            disabled={isLocating}
            className="w-full bg-bg-3 hover:bg-zinc-900 border border-border hover:border-lime/40 text-text-main hover:text-lime text-xs font-bold py-2 px-3.5 rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-[0.99] disabled:opacity-50"
          >
            <Compass size={14} className={isLocating ? "animate-spin text-lime" : "text-lime-mid"} />
            {isLocating ? "Menghubungkan GPS..." : "Gunakan GPS Hubungkan Lokasi Saya 📍"}
          </button>
        </div>
      )}

      {/* Inputs Form */}
      <div className="flex flex-col gap-3 mt-1">
        {/* Unified Location & Details Field */}
        <div className="flex flex-col gap-1">
          <label className="text-[10.5px] font-bold text-text-main uppercase tracking-[0.06em] font-mono flex items-center justify-between">
            <span className="flex items-center gap-1">
              Lokasi, Detail Alamat & Patokan <span className="text-red-500 font-extrabold">*</span>
            </span>
            <span className="text-[9px] text-lime font-medium lowercase font-sans">wajib diisi</span>
          </label>
          
          <textarea
            required
            value={addressText}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder="Tulis nama cafe/rumah, rincian alamat detail, ATAU paste link share Google Maps Anda langsung disini. Aman & tersimpan!"
            className={`px-3 py-2.5 rounded-lg bg-bg-2 border font-medium text-[12px] text-text-main transition-colors focus:outline-none focus:ring-1 h-[100px] resize-none leading-relaxed ${!addressText.trim() ? "border-amber-500/50 focus:border-amber-500 focus:ring-amber-500/20" : "border-border focus:border-lime focus:ring-lime/20"}`}
          />

          {reverseGeocoding && (
            <span className="text-lime animate-pulse font-medium text-[9px] font-mono mt-0.5">
              Membaca alamat otomatis...
            </span>
          )}

          {!addressText.trim() && (
            <p className="text-[9.5px] text-amber-400/95 font-mono leading-none mt-1.5 flex items-center gap-1 animate-pulse">
              <AlertCircle size={10} /> Mohon tulis nama tempat, alamat, atau link Google Maps pertemuan
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
