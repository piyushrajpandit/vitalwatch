"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default marker icons for Next.js bundling
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "/leaflet/marker-icon-2x.png",
    iconUrl: "/leaflet/marker-icon.png",
    shadowUrl: "/leaflet/marker-shadow.png",
});

interface Hospital {
    id: number;
    name: string;
    lat: number;
    lng: number;
    distance: number;
}

interface DoctorMapProps {
    userLat: number;
    userLng: number;
    hospitals: Hospital[];
    selectedHospital: Hospital | null;
    routeGeo: any | null;
    onSelectHospital: (h: Hospital) => void;
}

export default function DoctorMap({ userLat, userLng, hospitals, selectedHospital, routeGeo, onSelectHospital }: DoctorMapProps) {
    const mapRef = useRef<L.Map | null>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const markersRef = useRef<L.LayerGroup | null>(null);
    const routeLayerRef = useRef<L.GeoJSON | null>(null);

    // Initialize map once
    useEffect(() => {
        if (mapRef.current || !mapContainerRef.current) return;

        const map = L.map(mapContainerRef.current, {
            center: [userLat, userLng],
            zoom: 13,
            zoomControl: true,
            attributionControl: true,
        });

        L.tileLayer(
            "https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png",
            { attribution: "&copy; OpenStreetMap &copy; CartoDB", maxZoom: 19 }
        ).addTo(map);

        // User location marker (blue)
        const userIcon = L.divIcon({
            className: "",
            html: `<div style="width:16px;height:16px;background:#3b82f6;border:3px solid #fff;border-radius:50%;box-shadow:0 0 12px rgba(59,130,246,0.8)"></div>`,
            iconSize: [16, 16],
            iconAnchor: [8, 8],
        });
        L.marker([userLat, userLng], { icon: userIcon })
            .addTo(map)
            .bindPopup("<b>📍 You are here</b>");

        markersRef.current = L.layerGroup().addTo(map);
        mapRef.current = map;

        return () => {
            map.remove();
            mapRef.current = null;
        };
    }, [userLat, userLng]);

    // Update hospital markers
    useEffect(() => {
        if (!mapRef.current || !markersRef.current) return;
        markersRef.current.clearLayers();

        const hospitalIcon = L.icon({
            iconUrl: "/leaflet/marker-icon.png",
            iconRetinaUrl: "/leaflet/marker-icon-2x.png",
            shadowUrl: "/leaflet/marker-shadow.png",
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
        });

        hospitals.forEach((h) => {
            const marker = L.marker([h.lat, h.lng], { icon: hospitalIcon })
                .bindPopup(`
                    <div style="font-family:sans-serif;min-width:140px">
                        <b style="font-size:13px">${h.name}</b><br/>
                        <span style="font-size:11px;color:#888">${h.distance.toFixed(1)} km away</span><br/>
                        <button onclick="window.__selectHospital(${h.id})" style="margin-top:6px;padding:4px 12px;background:#3b82f6;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:11px;font-weight:bold">Select</button>
                    </div>
                `);
            markersRef.current!.addLayer(marker);
        });

        // Global handler for popup button
        (window as any).__selectHospital = (id: number) => {
            const found = hospitals.find((h) => h.id === id);
            if (found) onSelectHospital(found);
        };
    }, [hospitals, onSelectHospital]);

    // Draw/clear route
    useEffect(() => {
        if (!mapRef.current) return;

        if (routeLayerRef.current) {
            mapRef.current.removeLayer(routeLayerRef.current);
            routeLayerRef.current = null;
        }

        if (routeGeo) {
            routeLayerRef.current = L.geoJSON(routeGeo, {
                style: { color: "#22d3ee", weight: 6, opacity: 0.8 },
            }).addTo(mapRef.current);
            mapRef.current.fitBounds(routeLayerRef.current.getBounds(), { padding: [40, 40] });
        }
    }, [routeGeo]);

    // Pan to selected hospital
    useEffect(() => {
        if (mapRef.current && selectedHospital) {
            mapRef.current.flyTo([selectedHospital.lat, selectedHospital.lng], 14, { duration: 1 });
        }
    }, [selectedHospital]);

    return (
        <div
            ref={mapContainerRef}
            className="w-full rounded-2xl overflow-hidden border-2 border-slate-800"
            style={{ height: 420 }}
        />
    );
}
