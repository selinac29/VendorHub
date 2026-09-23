import React, { useMemo } from "react";
import {
  GoogleMap,
  Marker,
  InfoWindow,
  useLoadScript,
} from "@react-google-maps/api";

const mapContainerStyle = {
  width: "100%",
  height: "500px",
  borderRadius: "1rem",
};

const defaultCenter = {
  lat: 49.2827,
  lng: -123.1207,
};

const options = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
};

function EventMap({
  events,
  onMarkerClick,
  selectedEvent,
  mapRef,
  onDetailsClick,
}) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
  });

  const center = useMemo(() => {
    // If there's a selected event with coordinates, center on it
    if (
      selectedEvent?.location?.coordinates?.lat &&
      selectedEvent?.location?.coordinates?.lng
    ) {
      return {
        lat: selectedEvent.location.coordinates.lat,
        lng: selectedEvent.location.coordinates.lng,
      };
    }
    // Otherwise, center on Vancouver
    return defaultCenter;
  }, [selectedEvent]);

  // Filter events that have valid coordinates
  const eventsWithCoords = events.filter(
    (event) =>
      event.location?.coordinates?.lat && event.location?.coordinates?.lng,
  );

  if (loadError) {
    return (
      <div
        className="map-error"
        style={{
          padding: "2rem",
          textAlign: "center",
          color: "var(--error-red)",
        }}
      >
        Error loading map. Please check your API key.
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>Loading map...</div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      zoom={13}
      center={center}
      options={options}
    >
      {eventsWithCoords.map((event) => (
        <Marker
          key={event._id}
          position={{
            lat: event.location.coordinates.lat,
            lng: event.location.coordinates.lng,
          }}
          onClick={() => onMarkerClick(event)}
          animation={window.google?.maps?.Animation?.DROP}
        />
      ))}

      {selectedEvent && selectedEvent.location?.coordinates?.lat && (
        <InfoWindow
          position={{
            lat: selectedEvent.location.coordinates.lat,
            lng: selectedEvent.location.coordinates.lng,
          }}
          onCloseClick={() => onMarkerClick(null)}
        >
          <div className="map-info-window">
            <div className="overlay-card-category">
              {selectedEvent.category || "other"}
            </div>
            <h4
              style={{ margin: "0 0 8px 0", fontSize: "18px", color: "#111" }}
            >
              {selectedEvent.name}
            </h4>
            {selectedEvent.description && (
              <p
                style={{ margin: "0 0 8px 0", fontSize: "12px", color: "#666" }}
              >
                {selectedEvent.description.substring(0, 100)}
                {selectedEvent.description.length > 100 && "..."}
              </p>
            )}
            <p style={{ margin: "0", fontSize: "11px", color: "#999" }}>
              {selectedEvent.location?.address || "Address not specified"}
            </p>
            <div
              className="map-info-pills"
              style={{ marginTop: "8px", display: "flex", gap: "8px" }}
            >
              <span
                style={{
                  fontSize: "10px",
                  padding: "4px 10px",
                  background: "#e0e0e0",
                  color: "#111",
                  borderRadius: "12px",
                }}
              >
                {selectedEvent.entranceFee === "free"
                  ? "Free Admission"
                  : "Paid Admission"}
              </span>
              <span
                style={{
                  fontSize: "10px",
                  padding: "4px 10px",
                  background: "#e0e0e0",
                  color: "#111",
                  borderRadius: "12px",
                }}
              >
                {selectedEvent.priceRange}
              </span>
            </div>

            {/* View Details button */}
            <button
              onClick={() => onDetailsClick(selectedEvent)}
              style={{
                marginTop: "8px",
                padding: "4px 2px",
                color: "var(--dark-teal)",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: "700",
                marginLeft: "auto",
                display: "block",
              }}
            >
              View Details →
            </button>
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
}

export default EventMap;
