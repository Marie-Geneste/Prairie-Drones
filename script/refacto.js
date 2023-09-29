// =======================
// Configuration de la carte
// =======================
const mapConfig = {
    init() {
        const map = L.map('map').setView([43.2951, -0.3708], 14);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(map);
        return map;
    }
};

const map = mapConfig.init();

// =======================
// Gestion des drones
// =======================
const droneConfig = {
    droneCount: 0,
    dronesOnMap: {},
    dronePaths: {},

    init() {
        this.attachEventListeners();
    },

    attachEventListeners() {
        const gestionContainer = document.querySelector(".gestion-container");
        const buttonElement = document.querySelector(".plus-button");

        buttonElement.addEventListener('click', () => this.addDroneForm(gestionContainer, buttonElement));

        gestionContainer.addEventListener('click', (event) => {
            const droneForm = event.target.closest('.drone-form');
            if (droneForm) {
                const droneId = droneForm.querySelector(".drone-title").textContent.split(' ')[1];

                if (event.target.classList.contains('sendButton')) {
                    event.preventDefault();
                    this.handleDroneMovement(droneId, false, droneForm);
                } else if (event.target.classList.contains('returnButton')) {
                    event.preventDefault();
                    this.handleDroneMovement(droneId, true, droneForm);
                }
            }
        });

        // Événement pour modifier le nom du drone
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
    },

    addDroneForm(gestionContainer, buttonElement) {
        const formTemplate = document.querySelector(".drone-form");
        const clonedForm = formTemplate.cloneNode(true);

        // Configuration du formulaire cloné
        clonedForm.style.display = "block";
        const droneTitle = clonedForm.querySelector(".drone-title");
        droneTitle.textContent = "Drone " + ++this.droneCount;
        clonedForm.setAttribute("data-id", this.droneCount);
        clonedForm.querySelector(".start-adress-input").value = '';
        clonedForm.querySelector(".arrival-adress-input").value = '';
        const deleteButton = clonedForm.querySelector(".deleteButton");
        
        // Ajout d'écouteurs d'événements au formulaire cloné
        deleteButton.addEventListener('click', () => {
            this.removeDroneFromMap(droneTitle.textContent.split(' ')[1]);
            clonedForm.remove();
        });
        const startInput = clonedForm.querySelector('.start-adress-input');
        const arrivalInput = clonedForm.querySelector('.arrival-adress-input');

        // Ajout de l'autocomplétion
        this.attachAutocompletion(startInput);
        this.attachAutocompletion(arrivalInput);

        // Insertion du formulaire cloné dans le DOM
        gestionContainer.insertBefore(clonedForm, buttonElement);
    },

    attachAutocompletion(adressInput) {
        const geocoder = L.Control.Geocoder.nominatim();
        const resultList = adressInput.nextElementSibling;
        adressInput.addEventListener('input', function() {
            if (adressInput.value.length >= 3) {
                const viewbox = "-0.5, 43.2, -0.2, 43.4"; // Approximatif pour Pau
                const bounded = 1;
                const url = `https://nominatim.openstreetmap.org/search?q=${adressInput.value}&format=json&addressdetails=1&limit=5&viewbox=${viewbox}&bounded=${bounded}`;

                fetch(url)
                .then(response => response.json())
                .then(results => {
                    // Gestion des résultats d'autocomplétion
                    resultList.textContent = '';
                    results.forEach(function(result) {
                        const listItem = document.createElement('div');
                        listItem.textContent = result.display_name;
                        listItem.classList.add('result-item');
                        listItem.addEventListener('click', function() {
                            adressInput.value = result.display_name;
                            resultList.textContent = '';
                            adressInput.setAttribute('data-lat', result.lat);
                            adressInput.setAttribute('data-lon', result.lon);
                        });
                        resultList.appendChild(listItem);
                    });
                })
                .catch(error => console.error("Erreur lors de la recherche:", error));
            }
        });
    },

    displayDroneOnMap(droneId, startLatLng, endLatLng) {
        // Si le drone existe déjà, on récupère sa couleur. Sinon, générer une nouvelle couleur.
        const droneColor = this.dronesOnMap[droneId] ? this.dronesOnMap[droneId].color : this.getRandomColor();
    
        if(this.dronesOnMap[droneId] && this.dronesOnMap[droneId].drone){
            // Retirer le drone actuel de la carte
            map.removeLayer(this.dronesOnMap[droneId].drone);
        }
    
        const path = L.polyline([], {
            color: droneColor,
            dashArray: '5, 10'
        }).addTo(map);
    
        // Vérifier si le droneId existe déjà dans dronePaths
        if(!this.dronePaths[droneId]) {
            this.dronePaths[droneId] = [];
        }
    
        // Ajouter le tracé à dronePaths pour ce droneId
        this.dronePaths[droneId].push(path);
    
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
            updateCoordinatesDisplay(this.dronesOnMap[droneId].drone, droneId);
        }, 5000);
    
        currentDrone.on('end', function() {
            clearInterval(this.dronesOnMap[droneId].intervalId);
        });    
    
        this.dronesOnMap[droneId] = {
            drone: currentDrone,
            color: droneColor,
            //intervalId: intervalId
        };
        map.addLayer(currentDrone);
    },

    handleDroneMovement(droneId, isReturning, droneForm) {
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
        this.displayDroneOnMap(droneId, startLatLng, endLatLng);
    },

    removeDroneFromMap(droneId) {
        //Suprimer le drone
        if(this.dronesOnMap[droneId] && this.dronesOnMap[droneId].drone){
            map.removeLayer(this.dronesOnMap[droneId].drone);
            delete this.dronesOnMap[droneId];
        }

        // Supprimer les tracés associés
        if(this.dronePaths[droneId]){
            for(let path of this.dronePaths[droneId]) {
                map.removeLayer(path);
            }
            delete this.dronePaths[droneId];
        }
    },

    getRandomColor() {
        const letters = '0123456789ABCD'; //j'ai enlevé E et F pour éviter les couleurs trop claires
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * letters.length)];
        }
        return color; 
    }
};

droneConfig.init();
