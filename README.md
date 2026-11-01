# GDI — eenvoudige HTML/CSS/JavaScript website

Deze repository bevat een gewone statische website. Je hebt geen Node.js, npm of buildproces nodig.

## Bestanden
- `index.html`: structuur en pagina's.
- `style.css`: vormgeving en mobiele layout.
- `script.js`: navigatie, tactiekbord, versleepbare spelers, formaties, selectiebeheer, trainingsplanner en login.
- `firebase.js`: Firebase Web SDK-configuratie.
- `firestore.rules`: basisregels voor gebruikersgegevens.

## Publiceren met GitHub Pages
1. Open Settings → Pages in deze repository.
2. Kies bij Build and deployment: Deploy from a branch.
3. Selecteer branch `main` en map `/ (root)`.
4. Klik Save. GitHub Pages publiceert daarna de website.

## Firebase instellen
1. Maak een project aan in Firebase Console en voeg een Web App toe.
2. Kopieer de configwaarden uit Project settings → Your apps.
3. Vul ze in `firebase.js` in en commit het bestand.
4. Schakel Email/Password in bij Firebase Authentication.
5. Maak een Firestore Database aan.
6. Publiceer `firestore.rules` via Firestore → Rules.

Zonder Firebase-configuratie werkt de interface in demo-modus; demo-opslag is tijdelijk en alleen in de huidige browsersessie.

## Wat werkt al?
- Dashboard en navigatie.
- Tactiekbord met versleepbare spelers, vier formaties en tegenstanders.
- Eenvoudige animatiepreview.
- Spelers toevoegen en verwijderen (lokaal in de browser).
- Trainingen maken en opslaan.
- Firebase e-mail/wachtwoord-login en Firestore-opslag voor tactieken en trainingen.

## Nog niet gebouwd
- Permanente cloudopslag van de spelersselectie.
- Uitgebreide tactiekeditor met pijlen, looplijnen en zones.
- Geavanceerde animatietijdlijn.
- Wedstrijdkalender, live statistieken en wedstrijdrapporten.

GDI is bedoeld als gratis platform, zonder premium-betaalmuur.
