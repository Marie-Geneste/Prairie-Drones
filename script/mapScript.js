//AFFICHER LA CARTE
const map = L.map('map').setView([43.2951, -0.3708], 13);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map)


//Placer un drone sur la carte
//let drone1 = L.circle([51.500, -0.10], {
  //  color: 'red',
    //fillColor: '#f03',
    //fillOpacity: 0.5,
    //radius: 100
//}).addTo(map);



//Faire bouger les drones
function getDrones(droneNumber) {
    async function loadPositions() {
        const response = await fetch(`/data/dataDrone${droneNumber}.json`);
        const data = await response.json();
        return data;
    }

    let positions = [];    
    

    loadPositions().then(data=>{
        positions = data;
        console.log(data)

        const path = L.polyline([], {
            color: 'blue',
            dashArray: '5, 10'
        }).addTo(map);

        const myIcon = L.icon({
            iconUrl: "/images/drone.png",
            iconSize: [20, 20]
        });

        //ligne pointillée
        function updatePath(newLatLng) {
            let latlngs = path.getLatLngs();
            latlngs.push(newLatLng);
            path.setLatLngs(latlngs);
        }

        const line = L.polyline(data),
        animatedMarker = L.animatedMarker(line.getLatLngs(data), {
            icon: myIcon
        }).on('move', function(e){
            updatePath(e.latlng);
        });

        map.addLayer(animatedMarker);
    });

}

getDrones(1)
getDrones(2)

