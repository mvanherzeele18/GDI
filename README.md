# GDI — Groene Duivels Ingooigem

Statische ploegwebsite gebouwd met HTML, CSS en JavaScript, met Firebase als optionele cloudopslag.

## Publiceren via GitHub Pages
1. Open **Settings → Pages** in deze repository.
2. Kies **Deploy from a branch**.
3. Selecteer branch `main` en map `/ (root)`.
4. Klik op **Save**. Open daarna de GitHub Pages-URL van de repository.

## Firebase
De Firebase Web App-configuratie staat in `firebase.js`.
1. Schakel **Email/Password** in bij Firebase Authentication.
2. Maak een Cloud Firestore-database aan.
3. Publiceer de inhoud van `firestore.rules` via Firestore → Rules.
4. Voeg het GitHub Pages-domein toe aan Authentication → Settings → Authorized domains.

Zonder login worden gegevens lokaal in de browser bewaard. Met login worden spelers, wedstrijden en tactieken in de eigen gebruikersruimte in Firestore bewaard. Lokale gegevens worden niet automatisch naar een account gekopieerd.

## Functionaliteit
- **Ploeg & spelers:** spelers toevoegen, zoeken en verwijderen; rugnummers worden gecontroleerd op dubbels.
- **Wedstrijden:** tegenstander, datum, aftrap, thuis/uit, competitie en locatie bewaren.
- **Wedstrijdselectie:** open een wedstrijd en vink de spelers aan die geselecteerd zijn.
- **Uitslag:** markeer de wedstrijd als gespeeld en bewaar de doelpunten voor GDI en de tegenstander plus wedstrijdnotities.
- **Tactiekbord:** twee ploegen, acht formaties, spelers verslepen, pass-, loop-, dribbel-, schot-, lijn- en zonetekeningen, bal plaatsen en PNG-export.
- **Tactieken:** tactieken bewaren, laden, aanpassen en opnieuw opslaan.

## Aandachtspunten
- De selectie start leeg: vul zelf de spelers van je ploeg in.
- Er worden geen echte wedstrijdkalenders, uitslagen of officiële clubgegevens opgehaald.
- De Firebase Web API-key is een clientconfiguratie, geen servergeheim. Bescherm data met Authentication en de Firestore-regels.
- De website is een clubhulpmiddel, geen officiële GDI-clubwebsite. Gebruik het clublogo alleen als je daarvoor toestemming hebt.
