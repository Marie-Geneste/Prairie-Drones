# Prairie-Drones
Projet de la prairie des CDA-P4 : gestion et affichage de drones sur une carte


## Wireframe

Voici le lien figma pour voir ma maquette : https://www.figma.com/file/egKDzmanaMYSZomfMbk9Cb/Drones?type=design&node-id=0%3A1&mode=design&t=kH4FDBmLHEAVf6dL-1


## Lancement de l'application

Grâce à l'extention live server de VS Code sur le html.


## Explication de l'application

 ! Bug de dernière minutes (sinon c'est trop facile) : je n'ai plus accès à l'API, j'ai dû être bloquée au niveau des requêtes ! ...Et donc plus rien ne fonctionne...

 On peut ajouter un drone grâce au bouton + de l'encadré gauche.
 Un formulaire pour paramétrer les adresses de départ et d'arrivée apparaît.
 Le nom du drone est modifiable MAIS il faut l'éditer avant de lancer un drone sinon un bug apparaît (je n'ai pas pu le régler cette après-midi à cause du bug d'API).

 Quand on tape des adresses dans les input correspondant il y a une proposition d'adresse par l'API nominatim en dessous. On est obligé de selectionner une adresse de la liste pour récupérer la latitude et longitude envoyées au drone. Une fois les adresse sélectionnées comme ceci, on peut cliquer sur le bouton Send pour envoyer le drone puis sur le bouton Return pour voir le drone revenir. 
 Sur la carte un drone avec un tracé de couleur bouge de l'adresse de départ à l'adresse d'arrivée.
 Chaque drone a une couleur de tracé différente.
 Il y a un bouton pour supprimer le drone et son formulaire.


 ## Explication du code

 V1 qui fonctionnait avec le mapScript.js et les fichiers json en data. 
 L'appel de la fonction faisait apparaître un drone qui bougeait selon les données du json correspondant au numéro du drone.

 V2 : je voulais implémenter un tableau de gestion des drones où l'on pouvait choisir l'adresse. C'est chose faite, ça a marché toute la semaine et là je n'arrive plus à accéder à l'API. En espérant que sur un autre pc ça marche :D
 
 Pour cela j'ai tout fait dans le fichier gestionScript.js. J'ai mis chaque nouvelle fonctionnalité que j'implémentais les unes à la suite des autres. Ce n'est pas très bien organisé mais j'ai essayé de commenter un minimum.




