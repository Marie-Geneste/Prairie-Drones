//AFFICHER LA CARTE
const map = L.map('map').setView([51.505, -0.09], 13);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map)


//Placer un drone sur la carte
let drone1 = L.circle([51.500, -0.10], {
    color: 'red',
    fillColor: '#f03',
    fillOpacity: 0.5,
    radius: 100
}).addTo(map);

//Faire bouger le drone
console.log("DRONE 1", drone1);

async function loadPositions() {
    const response = await fetch('/data/data.json');
    const data = await response.json();
    return data;
}

let positions = [];

loadPositions().then(data=>{
    positions = data;
    console.log(data)

    setInterval(() => {
        drone1.setLatLng(data[0])
    }, 1000);  
});

console.log("DRONE 1 MOVED", drone1);
