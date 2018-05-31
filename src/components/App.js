import React, {Component} from 'react';
import LocationList from './LocationList';

class App extends Component {
   
    constructor(props) {
        super(props);
        this.state = {
            'alllocations': [
                {
                    'name': "Namsan Seoul Tower",
                    'type': "Tower",
                    'latitude': 37.551459,
                    'longitude': 126.988248,
                    'streetAddress': "105 Namsangongwon-gil, Yongsan 2(i)ga-dong, Yongsan-gu, Seoul"
                },
                {
                    'name': "Lotte World Tower",
                    'type': "Tower",
                    'latitude': 37.513067, 
                    'longitude': 127.102517 ,
                    'streetAddress': "300 Olympic-ro, Jamsil 6(yuk)-dong, Songpa-gu, Seoul"
                },
                {
                    'name': "The Shilla Jeju",
                    'type': "Hotel",
                    'latitude': 33.253978,
                    'longitude':126.408383,
                    'streetAddress': "3039-51 Saekdal-dong, Seogwipo, Jeju-do"
                },
                {
                    'name': "Tosokchon Samgyetang Chicken",
                    'type': "Restaurant",
                    'latitude': 37.585042,
                    'longitude': 126.971497,
                    'streetAddress': "5 Jahamun-ro 5-gil, Sajik-dong, Jongno-gu, Seoul"
                },
                {
                    'name': "Seoul Forest",
                    'type': "Park",
                    'latitude': 37.549853,
                    'longitude': 127.038067,
                    'streetAddress': "685 Seongsu-dong 1(il)-ga, Seongdong-gu, Seoul"
                },
                {
                    'name': "Namusairo",
                    'type': "Coffee",
                    'latitude': 37.579747,
                    'longitude':126.971119,
                    'streetAddress': "21 Sajik-ro 8-gil, Sajik-dong, Jongno-gu, Seoul"
                }
                
            ],
            'map': '',
            'infowindow': '',
            'prevmarker': ''
        };

        // retain object instance when used in the function
        this.initMap = this.initMap.bind(this);
        this.openInfoWindow = this.openInfoWindow.bind(this);
        this.closeInfoWindow = this.closeInfoWindow.bind(this);
    }

    componentDidMount() {
        // Connect the initMap() function within this class to the global window context,
        // so Google Maps can invoke it
        window.initMap = this.initMap;
        // Asynchronously load the Google Maps script, passing in the callback reference
        loadMapJS('https://maps.googleapis.com/maps/api/js?key=AIzaSyCupomo2J8EtSH1h9rOYVUXT05KAkL8bD4&callback=initMap')
    }

    /**
     * Initialise the map once the google map script is loaded
     */
    initMap() {
        var self = this;

        var mapview = document.getElementById('map');
        mapview.style.height = window.innerHeight + "px";
        var map = new window.google.maps.Map(mapview, {
            center: {lat: 37.532600 ,lng:  127.024612},
            zoom: 6,
            mapTypeControl: false
        });

        var InfoWindow = new window.google.maps.InfoWindow({});

        window.google.maps.event.addListener(InfoWindow, 'closeclick', function () {
            self.closeInfoWindow();
        });

        this.setState({
            'map': map,
            'infowindow': InfoWindow
        });

        window.google.maps.event.addDomListener(window, "resize", function () {
            var center = map.getCenter();
            window.google.maps.event.trigger(map, "resize");
            self.state.map.setCenter(center);
        });

        window.google.maps.event.addListener(map, 'click', function () {
            self.closeInfoWindow();
        });

        var alllocations = [];
        this.state.alllocations.forEach(function (location) {
            var longname = location.name + ' - ' + location.type;
            var marker = new window.google.maps.Marker({
                position: new window.google.maps.LatLng(location.latitude, location.longitude),
                animation: window.google.maps.Animation.DROP,
                map: map
            });

            marker.addListener('click', function () {
                self.openInfoWindow(marker);
            });

            location.longname = longname;
            location.marker = marker;
            location.display = true;
            alllocations.push(location);
        });
        this.setState({
            'alllocations': alllocations
        });
    }

    /**
     * Open the infowindow for the marker
     * @param {object} location marker
     */
    openInfoWindow(marker) {
        this.closeInfoWindow();
        this.state.infowindow.open(this.state.map, marker);
        marker.setAnimation(window.google.maps.Animation.BOUNCE);
        this.setState({
            'prevmarker': marker
        });
        this.state.infowindow.setContent('Loading Data...');
        this.state.map.setCenter(marker.getPosition());
        this.state.map.panBy(0, -200);
        this.getMarkerInfo(marker);
    }

    /**
     * Retrive the location data from the foursquare api for the marker and display it in the infowindow
     * @param {object} location marker
     */
    getMarkerInfo(marker) {
        var self = this;
        var clientId = "TPIDDHBKB2QFBWEV2MPDOFGUSWXCXGAA5IVOWEMN5ASR3UJW";
        var clientSecret = "4HB1ZZJBVXC3F0BREBPSGXYK0VZ5ALS4XRNJZSBP1JROG0DE";
        var url = "https://api.foursquare.com/v2/venues/search?client_id=" + clientId + "&client_secret=" + clientSecret + "&v=20130815&ll=" + marker.getPosition().lat() + "," + marker.getPosition().lng() + "&limit=1";
        fetch(url)
            .then(
                function (response) {
                    if (response.status !== 200) {
                        self.state.infowindow.setContent("Sorry data can't be loaded");
                        return;
                    }

                    // Examine the text in the response
                    response.json().then(function (data) {
                        var location_data = data.response.venues[0];
                        var verified = '<b>Verified Location: </b>' + (location_data.verified ? 'Yes' : 'No') + '<br>';
                        var checkinsCount = '<b>Number of CheckIn: </b>' + location_data.stats.checkinsCount + '<br>';
                        var usersCount = '<b>Number of Users: </b>' + location_data.stats.usersCount + '<br>';
                        var tipCount = '<b>Number of Tips: </b>' + location_data.stats.tipCount + '<br>';
                        var readMore = '<a href="https://foursquare.com/v/'+ location_data.id +'" target="_blank">Read More on Foursquare Website</a>'
                        self.state.infowindow.setContent(checkinsCount + usersCount + tipCount + verified + readMore);
                    });
                }
            )
            .catch(function (err) {
                self.state.infowindow.setContent("Sorry data can't be loaded");
            });
    }

    /**
     * Close the infowindow for the marker
     * @param {object} location marker
     */
    closeInfoWindow() {
        if (this.state.prevmarker) {
            this.state.prevmarker.setAnimation(null);
        }
        this.setState({
            'prevmarker': ''
        });
        this.state.infowindow.close();
    }

    /**
     * Render function of App
     */
    render() {
        return (
            <div>
                <LocationList key="100" alllocations={this.state.alllocations} openInfoWindow={this.openInfoWindow}
                              closeInfoWindow={this.closeInfoWindow}/>
                <div id="map"></div>
            </div>
        );
    }
}

export default App;

//* Load the google maps Asynchronously @param {url} url of the google maps script */
 
function loadMapJS(src) {
    var ref = window.document.getElementsByTagName("script")[0];
    var script = window.document.createElement("script");
    script.src = src;
    script.async = true;
    script.onerror = function () {
        document.write("Google Maps can't be loaded");
    };
    ref.parentNode.insertBefore(script, ref);
}