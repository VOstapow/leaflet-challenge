// Store our API endpoint inside QueryUrls
var earthquakeQueryUrl = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson";

// The following geoJSON gives layers of plate boundaries, geometry "LineString"
var plateQueryUrl = "https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json";

// The following geoJSON also produces a similar map
// It gives layers of type Plate, geometry "Polygon" - this would allow for selecting/mouseover on plates 
// var plateQueryURL = "https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_plates.json";

// RedYellowGreen color scale generated on ColorBrewer
// http://colorbrewer2.org/#type=diverging&scheme=RdYlGn&n=
// ['#ca0020','#fc8d59','#fee08b','#d9ef8b','#91cf60','#1a9850']

var giveColor = ['#1a9850','#91cf60','#d9ef8b','#fee08b','#fc8d59','#ca0020']

function getColor(d) {
 
  let color = '';
  if (d < 10) {
    color = '#1a9850';
  } else if (d < 30) {
    color = '#91cf60';
  } else if (d < 50) {
    color = '#d9ef8b';
  } else if (d < 70) {
    color = '#fee08b';
  } else if (d < 90) {
    color = '#fc8d59';
  } else { // depth 90+
    color = '#ca0020';
  }
  return color
}

function getRadius(d) {
  // The radius in L.circle is in the unit of meters, so we need to make it larger
  return 35000 * d;
}


// Perform a GET request to the query URL
d3.json(earthquakeQueryUrl, function (earthquakeData) {
  // Once we get a response, 
  // perform a second json query to get the plates 
  d3.json(plateQueryUrl, function (plateData) {
    // send the data.features object to the createFeatures function
    console.log(plateData);
    createFeatures(earthquakeData.features, plateData.features);
  });
});

function createFeatures(earthquakeData, plateData) {

  // Create a GeoJSON layer containing the features array on the earthquakeData object
  // Run the pointToLayer function once for each piece of data in the array
  var earthquakes = L.geoJSON(earthquakeData, {
    pointToLayer: function (feature, latlng) {

      // Depth determines the color
      var colora = getColor(feature.geometry.coordinates[2]);

      // Add circles to map
      return L.circle(latlng, {
        weight: 1,
        opacity: 0.75,
        fillOpacity: 0.90,
        color: "#455a64",
        fillColor: colora,
        // Adjust radius by magnitude
        radius: getRadius(feature.properties.mag)
      }).bindPopup("<h4> Magnitude: " + feature.properties.mag + "<br>Location:  " + feature.properties.place + "<br>Depth:  " + feature.geometry.coordinates[2] + "</p>");
    } // end pointToLayer

  });

  var plates = L.geoJSON(plateData, {
    style: function (feature) {
      return {
        color: "violet",
        weight: 3
      };
    }
  });

  // Sending our earthquakes layer to the createMap function
  createMap(earthquakes, plates);
}

function createMap(earthquakes, plates) {

  var satelliteMap = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    maxZoom: 18
  });

  var grayscaleMap =  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
    maxZoom: 18
  });

 
  // Define a baseMaps object to hold our base layers
  var baseMaps = {
    "Satellite": satelliteMap,
    "Gray Scale": grayscaleMap
  };

  // Create overlay object to hold our overlay layer
  var overlayMaps = {
    'Earthquakes': earthquakes,
    'Tectonic Plates': plates
  };

  // Create our map, giving it the satellite and earthquakes layers to display on load
  var myMap = L.map("map", {
    center: [
      37.09, -95.71
    ],
    zoom: 3,
    layers: [satelliteMap, earthquakes, plates]
  });

  var legend = L.control({
    position: 'bottomright'
  });

  legend.onAdd = function (map) {

    var div = L.DomUtil.create('div', 'info legend');
    var depths = [0, 1, 2, 3, 4, 5];
    var labels = ['-10-10', '10-30', '30-50', '50-70', '70-90', '90+'];

    // loop through our depth intervals and generate a label with a colored square for each interval
    for (var i = 0; i < depths.length; i++) {
      div.innerHTML +=
        '<i style="background:' + giveColor[i] + '"></i> ' + labels[i] + '<br>';
    }
    return div;
  }; // end legend.onAdd

  legend.addTo(myMap);

  // The following
  // https://gis.stackexchange.com/questions/68941/how-to-add-remove-legend-with-leaflet-layers-control
  // Add an event listener that adds/removes the legends if the earthquakes layer is added/removed.

  myMap.on('overlayremove', function (eventLayer) {
    if (eventLayer.name === 'Earthquakes') {
      this.removeControl(legend);
    }
  });

  myMap.on('overlayadd', function (eventLayer) {
    // Turn on the legend...
    if (eventLayer.name === 'Earthquakes') {
      legend.addTo(this);
    }
  });

  // Create a layer control
  // Pass in our baseMaps and overlayMaps
  // Add the layer control to the map
  L.control.layers(baseMaps, overlayMaps, {
    collapsed: false
  }).addTo(myMap);
}