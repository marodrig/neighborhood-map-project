'use strict';
// global variables
var map;
var infoWindow;
var bounds;

//map initialization
function initMap() {
    var myCity = {
        lat: 42.361145,
        lng: -71.057083
    };

    map = new google.maps.Map(document.getElementById('map'), {
        center: myCity,
        zoom: 18
    });
    // Setup up metro routes layer.
    var transitLayer = new google.maps.TransitLayer();
    transitLayer.setMap(map);
    infoWindow = new google.maps.InfoWindow();
    bounds = new google.maps.LatLngBounds();
    ko.applyBindings(new NeighborhoodMapViewModel());
}

// Error handling of Google Maps API.
function errorHandling() {
    alert("Error with Google Maps API.");
}

//Array of map locations.
var locationArray = [
    {
        name: 'Central Station',
        location: {
            lat: 42.3651634477,
            lng: -71.103322506
        }
	},
    {
        name: 'Kendall/MIT Station',
        location: {
            lat: 42.3624602268,
            lng: -71.0865855217
        }
    },
    {
        name: 'Harvard Square Station',
        location: {
            lat: 42.373939,
            lng: -71.119106
        }
    },
    {
        name: 'Charles/Massachusetts General Hospital Station',
        location: {
            lat: 42.3612710899,
            lng: -71.0720801353
        }
    },
    {
        name: 'MIT Museum',
        location: {
            lat: 42.357665236,
            lng: -71.092832962
        }
    },
    {
        name: 'Rod Dee',
        location: {
            lat: 42.343040,
            lng: -71.1167
        }
    },
    {
        name: 'Harvard University',
        location: {
            lat: 42.3770,
            lng: -71.116629
        }
    },
    {
        name: 'Massachusetts Institute of Technology',
        location: {
            lat: 42.3601,
            lng: -71.0942
        }
    }
];

// Location object
var MapLocation = function (data) {
    var self = this;
    this.name = data.name;
    this.position = data.location;
    this.street = "";
    this.city = "";
    this.phone = "";

    this.visible = ko.observable(true);

    // 
    var defaultIcon = makeMarkerIcon('FF00FF');
    // highlighted marker
    var highlightedIcon = makeMarkerIcon('00FFFF');

    // Foursquare API settings
    var clientID = "LQRWX2N2YFMYRI451DXCFBP0LQYZCXTUNNZSW04JIAUEMSVH";
    var clientSecret = "M15I4MBAXTYAUNCPGMFXDSQJVPJID1FYYVZ2XIU5Y12E4Q3F";

    var foursquareURL = 'https://api.foursquare.com/v2/venues/search?ll=' + this.position.lat + ',' + this.position.lng + '&client_id=' + clientID + '&client_secret=' + clientSecret + '&v=20160118' + '&query=' + this.name;

    $.getJSON(foursquareURL).done(function (data) {
        var results = data.response.venues[0];
        console.log(results.location.formattedAddress[0]);
        self.street = results.location.formattedAddress[0] ? results.location.formattedAddress[0] : 'N/A';
        self.city = results.location.formattedAddress[1] ? results.location.formattedAddress[1] : 'N/A';
        self.phone = results.contact.formattedPhone ? results.contact.formattedPhone : 'N/A';
    }).fail(function () {
        alert("There was an error with the Foursquare API call. Please refresh the page and try again to load Foursquare data.");
    });

    // Create a marker per location, and put into markers array
    this.marker = new google.maps.Marker({
        position: this.position,
        title: this.name,
        animation: google.maps.Animation.DROP,
        icon: defaultIcon
    });

    self.filterMarkers = ko.computed(function () {
        if (self.visible() === true) {
            self.marker.setMap(map);
            bounds.extend(self.marker.position);
            map.fitBounds(bounds);
        } else {
            self.marker.setMap(null);
        }
    });

    // Create an onclick event 
    this.marker.addListener('click', function () {
        populateInfoWindow(this, self.street, self.city, self.phone, infoWindow);
        toggleBounce(this);
        map.panTo(this.getPosition());
    });

    // Two event listeners
    // to change the colors back and forth.
    this.marker.addListener('mouseover', function () {
        this.setIcon(highlightedIcon);
    });
    this.marker.addListener('mouseout', function () {
        this.setIcon(defaultIcon);
    });

    // show item info when selected from list
    this.show = function (location) {
        google.maps.event.trigger(self.marker, 'click');
    };

    // creates bounce effect when item selected
    this.bounce = function (place) {
        google.maps.event.trigger(self.marker, 'click');
    };
};

var NeighborhoodMapViewModel = function () {
    var self = this;

    this.searchItem = ko.observable('');

    this.mapList = ko.observableArray([]);

    locationArray.forEach(function (location) {
        self.mapList.push(new MapLocation(location));
    });

    this.locationList = ko.computed(function () {
        var searchFilter = self.searchItem().toLowerCase();
        if (searchFilter) {
            return ko.utils.arrayFilter(self.mapList(), function (location) {
                var str = location.name.toLowerCase();
                var result = str.includes(searchFilter);
                location.visible(result);
                return result;
            });
        }
        self.mapList().forEach(function (location) {
            location.visible(true);
        });
        return self.mapList();
    }, self);
};

// populates the info window.
function populateInfoWindow(marker, street, city, phone, infowindow) {
    if (infowindow.marker != marker) {
        infowindow.setContent('');
        infowindow.marker = marker;

        infowindow.addListener('closeclick', function () {
            infowindow.marker = null;
        });
        var streetViewService = new google.maps.StreetViewService();
        var radius = 50;

        var windowContent = '<h4>' + marker.title + '</h4>' +
            '<p>' + street + "<br>" + city + '<br>' + phone + "</p>";

        var getStreetView = function (data, status) {
            if (status == google.maps.StreetViewStatus.OK) {
                var nearStreetViewLocation = data.location.latLng;
                var heading = google.maps.geometry.spherical.computeHeading(
                    nearStreetViewLocation, marker.position);
                infowindow.setContent(windowContent + '<div id="pano"></div>');
                var panoramaOptions = {
                    position: nearStreetViewLocation,
                    pov: {
                        heading: heading,
                        pitch: 20
                    }
                };
                var panorama = new google.maps.StreetViewPanorama(
                    document.getElementById('pano'), panoramaOptions);
            } else {
                infowindow.setContent(windowContent + '<div style="color: red">No Street View Found</div>');
            }
        };
        streetViewService.getPanoramaByLocation(marker.position, radius, getStreetView);
        infowindow.open(map, marker);
    }
}

function toggleBounce(marker) {
    if (marker.getAnimation() !== null) {
        marker.setAnimation(null);
    } else {
        marker.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(function () {
            marker.setAnimation(null);
        }, 1400);
    }
}

// Create a marker with a new color.
function makeMarkerIcon(markerColor) {
    var markerImage = new google.maps.MarkerImage(
        'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|' + markerColor +
        '|40|_|%E2%80%A2',
        new google.maps.Size(21, 34),
        new google.maps.Point(0, 0),
        new google.maps.Point(10, 34),
        new google.maps.Size(21, 34));
    return markerImage;
}
