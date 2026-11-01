# GDI — Groene Duivels Ingooigem

Een statische club- en ploegmap gebouwd met HTML, CSS, JavaScript en Firebase.

## Publiceren
1. Open Settings → Pages.
2. Kies Deploy from a branch.
3. Selecteer `main` en `/ (root)`.
4. Sla op. GitHub Pages publiceert de site.

## Firebase instellen
De Firebase Web App-configuratie staat in `firebase.js`.
1. Schakel Email/Password in via Firebase Authentication.
2. Maak een Cloud Firestore database aan.
3. Publiceer `firestore.rules` via Firestore → Rules.
4. Voeg bij Firebase Authentication → Settings → Authorized domains je GitHub Pages-domein toe (bijvoorbeeld `mvanherzeele18.github.io`).

## Onderdelen
- Overzicht met aantallen en eerstvolgende wedstrijd.
- Spelerslijst met toevoegen, zoeken en verwijderen.
- Tactiekbord met 4-3-3, 4-2-3-1, 3-5-2, 4-4-2 en 5-3-2, spelers verslepen, tegenstander tonen en opstellingen bewaren/laden.
- Trainingsvoorbereiding met datum, duur, doel en oefeningen.
- Wedstrijdplanning met tegenstander, datum, uur, thuis/uit en locatie.
- Ploegnotities.
- Firebase e-mail/wachtwoordaccounts en persoonlijke Firestore-gegevens.
- Lokale opslag als je niet ingelogd bent.

## Belangrijk
De spelerslijst start leeg: vul de echte selectie zelf in. De website bevat geen officiële clubgegevens, logo-afbeelding, wedstrijdkalender, uitslagen, klassement of contactgegevens tenzij je die zelf toevoegt. De clubstijl gebruikt een eenvoudige GDI-woordmarkering en is geen officieel clublogo.

De Firebase-configuratie voor een webapp is geen servergeheim. De veiligheid van ploeggegevens hangt af van Authentication, de Firestore Security Rules en het correct instellen van toegestane domeinen. Test de regels in Firebase Console voordat je echte persoonsgegevens toevoegt.

De app is een praktische basisversie; functies zoals aanwezigheidsregistratie, rollen/rechten voor trainers en spelers, uitnodigingen, pushmeldingen, exports en live competitie-integraties zijn nog niet ingebouwd.
