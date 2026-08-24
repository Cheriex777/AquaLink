import L from 'leaflet'

export const PROPERTY_ICON = L.divIcon({
  className: 'jalseyu-map-pin',
  html:
    '<svg width="30" height="30" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">' +
    '<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" ' +
    'fill="#0891b2" stroke="#ffffff" stroke-width="1.5"/>' +
    '<circle cx="12" cy="9" r="2.5" fill="#ffffff"/></svg>',
  iconSize: [30, 30],
  iconAnchor: [15, 28],
})

export const VERTEX_ICON = L.divIcon({
  className: 'jalseyu-vertex-dot',
  html:
    '<svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">' +
    '<circle cx="8" cy="8" r="6" fill="#0891b2" stroke="#ffffff" stroke-width="2"/></svg>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
})
