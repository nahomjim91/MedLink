import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import map components to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);

const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);

const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);

const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);
const MapModal = ({
  isOpen,
  onClose,
  location,
  title = "Location",
  zoom = 15,
  height = 240,
  mapProvider = "openstreetmap",
  showAddressDetails = true,
  buttonText = "Open in Map"
}) => {
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  // Load Leaflet CSS
  useEffect(() => {
    import('leaflet/dist/leaflet.css');
    
    // Fix for default markers in react-leaflet
    import('leaflet').then((L) => {
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      });
      setLeafletLoaded(true);
    });
  }, []);

  if (!isOpen) return null;

  // Get coordinates for the map
  const getMapCenter = () => {
    if (location?.address?.geoLocation) {
      return [location.address.geoLocation.latitude, location.address.geoLocation.longitude];
    }
    // Default to a central location if no coordinates available
    return [51.505, -0.09]; // London coordinates as fallback
  };

  // Get tile layer URL based on provider
  const getTileLayerUrl = () => {
    const providers = {
      openstreetmap: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      cartodb: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      cartodbdark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      satellite: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
    };
    return providers[mapProvider] || providers.openstreetmap;
  };

  // Get attribution based on provider
  const getAttribution = () => {
    const attributions = {
      openstreetmap: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      cartodb: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      cartodbdark: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      satellite: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    };
    return attributions[mapProvider] || attributions.openstreetmap;
  };

  // Handle external map opening
  const handleOpenExternalMap = () => {
    if (location?.address?.geoLocation) {
      const { latitude, longitude } = location.address.geoLocation;
      let url;
      
      if (mapProvider === "openstreetmap") {
          url = `https://www.google.com/maps?q=${latitude},${longitude}`;
        } else {
            // Fallback to Google Maps for other providers
            url = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}&zoom=16`;
      }
      
      window.open(url, "_blank");
    }
  };

  const mapCenter = getMapCenter();
  const hasValidCoordinates = location?.address?.geoLocation;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ×
          </button>
        </div>

        {/* Location Info */}
        {showAddressDetails && location && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-800 mb-2">
              {location.name}
            </h4>
            <div className="space-y-1 text-sm text-gray-600">
              <p>
                <span className="font-medium">Street:</span>{" "}
                {location?.address?.street || "N/A"}
              </p>
              <p>
                <span className="font-medium">City:</span>{" "}
                {location?.address?.city || "N/A"}
              </p>
              <p>
                <span className="font-medium">State:</span>{" "}
                {location?.address?.state || "N/A"}
              </p>
              <p>
                <span className="font-medium">Country:</span>{" "}
                {location?.address?.country || "N/A"}
              </p>
              <p>
                <span className="font-medium">Postal Code:</span>{" "}
                {location?.address?.postalCode || "N/A"}
              </p>
              {location?.address?.geoLocation && (
                <p>
                  <span className="font-medium">Coordinates:</span>{" "}
                  {location.address.geoLocationText}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Interactive Map */}
        <div className="rounded-lg overflow-hidden mb-4" style={{ height: `${height}px` }}>
          {leafletLoaded && hasValidCoordinates ? (
            <MapContainer
              center={mapCenter}
              zoom={zoom}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={false}
            >
              <TileLayer
                attribution={getAttribution()}
                url={getTileLayerUrl()}
              />
              <Marker position={mapCenter}>
                <Popup>
                  <div className="text-center">
                    <strong>{location.name}</strong>
                    <br />
                    {location?.address?.street && (
                      <>
                        {location.address.street}
                        <br />
                      </>
                    )}
                    {location?.address?.city && location?.address?.state && (
                      <>
                        {location.address.city}, {location.address.state}
                      </>
                    )}
                  </div>
                </Popup>
              </Marker>
            </MapContainer>
          ) : !hasValidCoordinates ? (
            <div className="bg-gray-100 rounded-lg h-full flex items-center justify-center">
              <div className="text-center text-gray-500">
                <div className="text-4xl mb-2">📍</div>
                <p className="text-sm">No coordinates available</p>
                <p className="text-xs mt-1">Address information only</p>
              </div>
            </div>
          ) : (
            <div className="bg-gray-100 rounded-lg h-full flex items-center justify-center">
              <div className="text-center text-gray-500">
                <div className="text-4xl mb-2">🗺️</div>
                <p className="text-sm">Loading map...</p>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleOpenExternalMap}
            disabled={!hasValidCoordinates}
            className="flex-1 bg-primary/70 text-white py-2 px-4 rounded-lg hover:bg-primary disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
          >
            {buttonText}
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-white hover:border-error hover:border hover:text-error text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default MapModal;