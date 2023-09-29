//AFFICHER LA CARTE
const map = L.map('map').setView([43.2951, -0.3708], 14);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map)

//bouton + v1
//let droneCount = 1;

//const buttonElement = document.querySelector(".plus-button");
//const formElement = document.querySelector(".drone-form");
//const droneTitleElement = document.querySelector(".drone-title");

//buttonElement.addEventListener('click', showInputForm);

//function showInputForm(event){
    //event.preventDefault();
    
    // Toggle du formulaire
    //formElement.style.display === "block" ?  formElement.style.display = "none" : formElement.style.display = "block";
//}

//bouton + v2
let droneCount = 0;

const buttonElement = document.querySelector(".plus-button");
const formTemplate = document.querySelector(".drone-form");
const gestionContainer = document.querySelector(".gestion-container");

buttonElement.addEventListener('click', addDroneForm);

function addDroneForm(){
    // Cloner le template
    const clonedForm = formTemplate.cloneNode(true);
    clonedForm.style.display = "block"; // Montrer le formulaire cloné
    clonedForm.classList.add("drone-form");

    // Mettre à jour le titre du drone
    const droneTitle = clonedForm.querySelector(".drone-title");
    droneTitle.textContent = "Drone " + ++droneCount;
    clonedForm.setAttribute("data-id", droneCount);


    // Réinitialiser les champs du formulaire cloné
    clonedForm.querySelector(".start-adress-input").value = '';
    clonedForm.querySelector(".arrival-adress-input").value = '';

    // Ajouter des écouteurs d'événements pour la suppression
    const deleteButton = clonedForm.querySelector(".deleteButton");
    deleteButton.addEventListener('click', function() {
        const droneId = clonedForm.querySelector(".drone-title").textContent.split(' ')[1];
        // Supprimer le drone de la carte
        removeDroneFromMap(droneId);
        // Supprimer le formulaire du drone
        clonedForm.remove();
    });

    // Associer les événements pour la géolocalisation
    const startInput = clonedForm.querySelector('.start-adress-input');
    const arrivalInput = clonedForm.querySelector('.arrival-adress-input');

    getResultListForAdressInput(startInput, 'start');
    getResultListForAdressInput(arrivalInput, 'arrival');

    // Insérer le formulaire cloné juste avant le bouton "+"
    gestionContainer.insertBefore(clonedForm, buttonElement);
}




//autocomplétion adresse
const geocoder = L.Control.Geocoder.nominatim();

function getResultListForAdressInput (adressInput) {
    const resultList = adressInput.nextElementSibling;

    adressInput.addEventListener('input', getAutocompletion);

    function getAutocompletion() {
        if (adressInput.value.length >= 3) {
            const viewbox = "-0.5, 43.2, -0.2, 43.4"; // Approximatif pour Pau
            const bounded = 1;

            const url = `https://nominatim.openstreetmap.org/search?q=${adressInput.value}&format=json&addressdetails=1&limit=5&viewbox=${viewbox}&bounded=${bounded}`;

            fetch(url)
            .then(response => response.json())
            .then(results => {
                // Vider les résultats précédents
                resultList.textContent = '';
                
                // Parcourir chaque résultat
                results.forEach(function(result) {
                    // Créer un élément de liste pour chaque résultat
                    const listItem = document.createElement('div');
                    listItem.textContent = result.display_name;
                    listItem.classList.add('result-item');

                    // Ajouter un événement de clic à chaque élément de la liste pour gérer la sélection
                    listItem.addEventListener('click', function() {
                        adressInput.value = result.display_name; // Met à jour la valeur de l'input
                        resultList.textContent = ''; // Cache les résultats
                 
                    // Stocker les coordonnées dans l'input lui-même
                    adressInput.setAttribute('data-lat', result.lat);
                    adressInput.setAttribute('data-lon', result.lon);
                    });

                    // Ajouter l'élément de liste à la div des résultats
                    resultList.appendChild(listItem);
                });
            })
            .catch(error => {
                console.error("Erreur lors de la recherche:", error);
            });
        }
    }
}

//getResultListForAdressInput(startInput);
//getResultListForAdressInput(arrivalInput);


//Drones dans le DOM
let currentDrone = null;
let dronesOnMap = {};
let dronePaths = {};

function displayDroneOnMap(droneId, startLatLng, endLatLng) {
    // Si le drone existe déjà, on récupère sa couleur. Sinon, générer une nouvelle couleur.
    const droneColor = dronesOnMap[droneId] ? dronesOnMap[droneId].color : getRandomColor();

    if(dronesOnMap[droneId] && dronesOnMap[droneId].drone){
        // Retirer le drone actuel de la carte
        map.removeLayer(dronesOnMap[droneId].drone);
    }

    const path = L.polyline([], {
        color: droneColor,
        dashArray: '5, 10'
    }).addTo(map);

    // Vérifier si le droneId existe déjà dans dronePaths
    if(!dronePaths[droneId]) {
        dronePaths[droneId] = [];
    }

    // Ajouter le tracé à dronePaths pour ce droneId
    dronePaths[droneId].push(path);

    const myIcon = L.icon({
        iconUrl: "/images/drone.png",
        iconSize: [20, 20]
    });

    function updatePath(newLatLng) {
        let latlngs = path.getLatLngs();
        latlngs.push(newLatLng);
        path.setLatLngs(latlngs);
    }

    const line = L.polyline([startLatLng, endLatLng]);
    currentDrone = L.animatedMarker(line.getLatLngs(), {
        icon: myIcon
    }).on('move', function(e){
        updatePath(e.latlng);
    });

    //mise à jour des coordonnées du drone
    function updateCoordinatesDisplay(drone, droneId) {
        const latlng = drone.getLatLng();
        console.log(latlng);
        const displayDiv = document.querySelector(`.drone-form[data-id="${droneId}"] .coordinatesDisplay`);
        if (displayDiv) { // Ajout d'une vérification pour s'assurer que displayDiv n'est pas null
            displayDiv.textContent = `Latitude: ${latlng.lat.toFixed(3)}, Longitude: ${latlng.lng.toFixed(3)}`;
        } else {
            console.error(`Element with data-id=${droneId} not found`);
        }
    }

    const intervalId = setInterval(() => {
        updateCoordinatesDisplay(dronesOnMap[droneId].drone, droneId);
    }, 5000);

    currentDrone.on('end', function() {
        clearInterval(dronesOnMap[droneId].intervalId);
    });    

    dronesOnMap[droneId] = {
        drone: currentDrone,
        color: droneColor,
        //intervalId: intervalId
    };
    map.addLayer(currentDrone);
}


//submit and return
function handleDroneMovement(droneId, isReturning = false, droneForm) {
    const startAdressInput = droneForm.querySelector(".start-adress-input");
    const arrivalAdressInput = droneForm.querySelector(".arrival-adress-input");

    let startLat = startAdressInput.getAttribute('data-lat');
    let startLon = startAdressInput.getAttribute('data-lon');
    let arrivalLat = arrivalAdressInput.getAttribute('data-lat');
    let arrivalLon = arrivalAdressInput.getAttribute('data-lon');

    // Si c'est le retour, inversez les coordonnées
    if (isReturning) {
        [startLat, arrivalLat] = [arrivalLat, startLat];
        [startLon, arrivalLon] = [arrivalLon, startLon];
    }

    console.log("STARTLAT", startLat);
    console.log("STARTLON", startLon);
    console.log("ARRIVALLAT", arrivalLat);
    console.log("ARRIVALLON", arrivalLon);

    // Vérification pour s'assurer que les valeurs récupérées sont valides
    if (isNaN(startLat) || isNaN(startLon) || isNaN(arrivalLat) || isNaN(arrivalLon)) {
        alert("Veuillez sélectionner des adresses valides pour le départ et l'arrivée.");
        return;
    }

    // Coordonnées de départ et d'arrivée
    const startLatLng = [parseFloat(startLat), parseFloat(startLon)];
    const endLatLng = [parseFloat(arrivalLat), parseFloat(arrivalLon)];

    // Afficher et déplacer le drone
    displayDroneOnMap(droneId, startLatLng, endLatLng);
}

const sendButton = document.querySelector('.sendButton');
sendButton.addEventListener('click', function(event) {
    event.preventDefault();
    handleDroneMovement();
});

const returnButton = document.querySelector('.returnButton');
returnButton.addEventListener('click', function(event) {
    event.preventDefault();
    handleDroneMovement(true);
});


gestionContainer.addEventListener('click', function(event) {
    const droneForm = event.target.closest('.drone-form');
    if (droneForm) {
        const droneId = droneForm.querySelector(".drone-title").textContent.split(' ')[1];

        if (event.target.classList.contains('sendButton')) {
            event.preventDefault();
            handleDroneMovement(droneId, false, droneForm);
        } else if (event.target.classList.contains('returnButton')) {
            event.preventDefault();
            handleDroneMovement(droneId, true, droneForm);
        }
    }
});


//suppression des drones de la carte
function removeDroneFromMap(droneId) {
    //Suprimer le drone
    if(dronesOnMap[droneId] && dronesOnMap[droneId].drone){
        map.removeLayer(dronesOnMap[droneId].drone);
        delete dronesOnMap[droneId];
    }

    // Supprimer les tracés associés
    if(dronePaths[droneId]){
        for(let path of dronePaths[droneId]) {
            map.removeLayer(path);
        }
        delete dronePaths[droneId];
    }
}

//couleur aléatoire pour les tracés des drones
function getRandomColor() {
    const letters = '0123456789ABCD'; //j'ai enlevé E et F pour éviter les couleurs trop claires
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * letters.length)];
    }
    return color;
}


//Modifier le nom du drone
document.addEventListener('click', function(event) {
    if(event.target.classList.contains('edit-button')) {
        const editTitleDiv = event.target.closest('.edit-title');
        const droneTitle = editTitleDiv.querySelector('.drone-title');
        
        // Convertir le titre en un champ de saisie
        const input = document.createElement('input');
        input.type = 'text';
        input.value = droneTitle.textContent;
        input.classList.add('drone-title-input');
        
        droneTitle.replaceWith(input);

        input.focus();

        // Lorsque l'utilisateur appuie sur Entrée ou que l'input perd le focus
        input.addEventListener('blur', saveTitle);
        input.addEventListener('keydown', function(e) {
            if(e.key === 'Enter') {
                saveTitle.call(this, e); 
            }
        });

        function saveTitle() {
            const newTitle = document.createElement('h2');
            newTitle.textContent = this.value;
            newTitle.classList.add('drone-title');

            this.replaceWith(newTitle);
        }
    }
});

