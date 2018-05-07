var map, clientID, clientSecret;

function AppViewModel() {
  var self = this;

  this.searchOption = ko.observable("");
  this.markers = [];

  this.populateInfoWindow = function(marker, infoWindow) {
    if(infoWindow.marker != marker){
      infoWindow.setContent('');
      infoWindow.marker = marker;
      //FourSquare API
      clientID =;
      clientSecret =;
      var apiUrl =;
      $.getJSON(apiUrl).done(function(marker) {
        
      })
    }
  }
}
