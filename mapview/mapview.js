function createSearchableMap(locations = allLocations) {
  var bounds = new google.maps.LatLngBounds();
  var mapOps = {mapTypeId: 'roadmap'};
  var markers = [];
  var infoWindowCont = [];
  var map = new google.maps.Map(document.getElementById('locations-near-you-map'), mapOps);
  
  map.setTilt(45);
  
  locations.forEach(function(location) {
    markers.push([location.name, location.lat, location.lng]);
    
    infoWindowCont.push(['<div class="infoWindow"><h3>' + location.name + 
                            '</h3><p>' + location.address + '<br />' + location.city + 
                            ', ' + location.state + ' ' + location.zip + '</p><p>Phone ' + 
                            location.phone + '</p></div>']);
  });	    

  var infoWindow = new google.maps.InfoWindow(), marker, i;
  
  //Set markers on map
  for (i = 0; i < markers.length; i++) {
    var position = new google.maps.LatLng(markers[i][1], markers[i][2]);
    bounds.extend(position);
    marker = new google.maps.Marker({
      position: position,
      map: map,
      title: markers[i][0]
    });
    
    //Information marker. Listen to click event
    google.maps.event.addListener(marker, 'click', (function(marker, i) {
      return function() {
        infoWindow.setContent(infoWindowCont[i][0]);
        infoWindow.open(map, marker);
      }
    })(marker, i));

    //Set bounds to zoom on map when there are several litter locations
    if (locations.length > 1) {
      map.fitBounds(bounds);
    } else {
      var center = new google.maps.LatLng(locations[0].lat, locations[0].lng);
      map.setCenter(center);
      map.setZoom(15);
    }
  }
}

function filterLocations() {
  var userLatLng;
  var geocoder = new google.maps.Geocoder();
  var userAddress = document.getElementById('userAddress').value.replace(/[^a-z0-9\s]/gi, '');
  var maxRadius = parseInt(document.getElementById('maxRadius').value, 10);
  
  if (userAddress && maxRadius) {
    userLatLng = getLatLngViaHttpRequest(userAddress);
  } 

  function getLatLngViaHttpRequest(address) {
    // Set up a request to geocoding API
    var addressStripped = address.split(' ').join('+');
    var key = "AIzaSyD5PWnOhc0yrKF-KGXOrhGyQPp22uNuQEw";
    var request = 'https://maps.googleapis.com/maps/api/geocode/json?address=' + addressStripped + '&key=' + key;
    
    //Call the geocoding API using GET from JQ
    $.get( request, function( data ) {
      var searchResultsAlert = document.getElementById('location-search-alert');

      //Error if no data is found
      if (data.status === "ZERO_RESULTS") {
        searchResultsAlert.innerHTML = "Oh no! '" + address + "' appears to be an invalid address.";
        return;
      }

      var userLatLng = new google.maps.LatLng(data.results[0].geometry.location.lat, data.results[0].geometry.location.lng);
      var filteredLocations = allLocations.filter(isWithinRadius);
      
      if (filteredLocations.length > 0) {
        createSearchableMap(filteredLocations);
        createListOfLocations(filteredLocations);
        searchResultsAlert.innerHTML = 'Litter Locations within ' + maxRadius + ' miles of ' + userAddress + ':';
      } else {
        console.log("nothing found!");
        document.getElementById('locations-near-you').innerHTML = '';
        searchResultsAlert.innerHTML = 'There are no litter locations were found within '+ maxRadius + ' miles of ' + userAddress + '.';
      }

      function isWithinRadius(location) {
        var locationLatLng = new google.maps.LatLng(location.lat, location.lng);
        var distanceBetween = google.maps.geometry.spherical.computeDistanceBetween(locationLatLng, userLatLng);

        return convertMetersToMiles(distanceBetween) <= maxRadius;
      }
    });  
  }
}

function convertMetersToMiles(meters) {
  return (meters * 0.0006218);
}

function createListOfLocations(locations) {
  var locList = document.getElementById('locations-near-you');
  
  //Clear existing locations from the previous search
  locList.innerHTML = '';
  
  locations.forEach( function(location) {
    var specificLocation = document.createElement('div');
    var locInfo = "<h4>" + location.name + "</h4><p>" + location.address + "</p>" +
                       "<p>"  + location.city + ", " + location.state + " " + location.zip + "</p><p>" + location.phone + "</p>";
    specificLocation.setAttribute("class", 'location-near-you-box');
    specificLocation.innerHTML = locInfo;
    locList.appendChild(specificLocation);
  });
}

$('#submitLocationSearch').on('click', function(e) {
  e.preventDefault();
  filterLocations();
});
