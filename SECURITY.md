# Sicherheitsrichtlinie

## Sicherheitsmodell

Cosmic Typist ist als lokale Anwendung vorgesehen. Der Server bindet
ausschließlich an 127.0.0.1 und speichert nur anonyme Spielwerte in
data/highscores.json. Es gibt keine Anmeldung, keine Cookies und keine
externe Datenübertragung.

Die Highscore-API akzeptiert nur kleine JSON-Anfragen mit geprüften Feldern.
Dateien werden atomar geschrieben. Browser-Header begrenzen die erlaubten
Skript-, Verbindungs- und Einbettungsquellen.

## Sicherheitsproblem melden

Bitte veröffentliche Sicherheitslücken nicht zuerst als öffentliches Issue.
Beschreibe stattdessen betroffene Datei und Version, Schritte zum Nachstellen,
erwartetes Verhalten, tatsächliches Verhalten und mögliche Auswirkungen.

Wenn das Projekt veröffentlicht wird, ergänze hier eine dedizierte
Sicherheits-E-Mail-Adresse und eine Reaktionszeit.

## Betriebshinweis

Die aktuelle Anwendung ist nicht als öffentlicher Mehrbenutzer-Server gedacht.
Für einen Internetbetrieb sind mindestens HTTPS, Authentifizierung,
Rate-Limiting, Logging-Konzept und eine serverseitige Datenbank erforderlich.
