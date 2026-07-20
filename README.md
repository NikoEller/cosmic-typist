# Cosmic Typist

Cosmic Typist ist ein lokales Tipptraining im Weltraum. Anfliegende Objekte
tragen Wörter, die vor dem Aufprall korrekt getippt werden müssen. Jeder
richtige Buchstabe feuert einen Laserschuss ab.

Das Projekt funktioniert ohne externe Abhängigkeiten und ohne Internet.

## Features

- Weltraum-Spiel mit Laser-, Mündungs- und Trefferanimationen
- Adaptives Endlos-Training und steigende Challenge
- WPM-, Genauigkeits-, Streak- und Schild-Anzeige
- Deutsche Wortlisten in drei Schwierigkeitsstufen
- Lokale Highscores mit Punkten, WPM und Modus
- Responsive Bedienung, Tastatursteuerung und reduzierte Animationen

## Starten

Voraussetzung: Python 3.10 oder neuer.

~~~bash
python3 app.py
~~~

Danach im Browser http://127.0.0.1:8000 öffnen. Der Server akzeptiert nur
Verbindungen vom eigenen Rechner.

Die statische Online-Demo läuft über GitHub Pages:
https://nikoeller.github.io/cosmic-typist/

Auf GitHub Pages werden Highscores nur im Browser-Speicher abgelegt. Die
lokale Python-Version verwendet weiterhin die Datei data/highscores.json.

## Steuerung

| Aktion | Steuerung |
| --- | --- |
| Ziel zerstören | Wort im Eingabefeld tippen |
| Pause / fortsetzen | Esc |
| Modus wählen | Button auf dem Startbildschirm |

## Spielmodi

### Endlos-Training

Dieser Modus berechnet aus WPM, Genauigkeit und Schilden eine behutsame
Schwierigkeit. Schnelleres, präzises Tippen führt zu etwas mehr Zielen;
Fehler oder wenige Schilde verschaffen wieder Zeit. Die Werte haben feste
Grenzen, damit der Modus nicht unspielbar wird.

### Challenge

Die Challenge steigt mit dem Score. Spawnrate und Flugtempo besitzen jedoch
eine Obergrenze. Der Modus bleibt damit herausfordernd, ohne bei hohen Scores
unkontrolliert zu eskalieren.

## Lokale Highscores

Nach einer Mission mit Punkten wird die Rangliste in data/highscores.json
gespeichert. Die Datei wird automatisch angelegt und enthält maximal zehn
Einträge. Es werden ausschließlich Score, WPM und Modus auf dem lokalen
Rechner gespeichert – keine Namen und keine Netzwerkdaten.

Eine beschädigte oder fehlende Datei führt zu einer leeren Bestenliste, nicht
zu einem Serverfehler. Schreibvorgänge erfolgen atomar, damit die bestehende
Datei bei einem Abbruch nicht halb geschrieben wird.

## Projektstruktur

~~~text
app.py          Lokaler HTTP-Server und validierte Highscore-API
index.html      Zugängliche Spieloberfläche
style.css       Responsives Design, Effekte und reduzierte Animationen
game.js         Spielzustand, Eingabe, Pacing und Browser-Kommunikation
words.js        Deutsche Wörter nach Schwierigkeit
tests/          Automatisierte Backend-Tests
~~~

## Qualität und Sicherheit

- Die API bindet nur an 127.0.0.1.
- Highscore-Anfragen sind größenbegrenzt und typgeprüft.
- Wörter und Highscores werden mit textContent ausgegeben; fremder HTML-Code
  wird nicht in die Seite eingefügt.
- Sichere Browser-Header begrenzen Skripte, Verbindungen und Einbettungen.
- Bei prefers-reduced-motion werden Animationen fast vollständig reduziert.

Details und der Meldeweg für Sicherheitsprobleme stehen in SECURITY.md.

## Tests

~~~bash
python3 -m unittest discover -s tests -v
python3 -m py_compile app.py
~~~

## Veröffentlichung

1. Führe die Tests aus und prüfe das Spiel in aktuellen Desktop- und Mobilbrowsern.
2. Ergänze vor einem Verkauf eigene Produkttexte, Screenshots und ein Impressum
   bzw. Datenschutzhinweise, wenn eine Website oder Telemetrie hinzukommt.
3. Prüfe, ob die MIT-Lizenz zu deinem Geschäftsmodell passt. Die Lizenz erlaubt
   kommerzielle Nutzung, verlangt aber den Lizenzhinweis.
4. Hoste die Anwendung nur hinter HTTPS, falls der Server später öffentlich
   erreichbar sein soll. Die aktuelle Version ist bewusst nur für localhost.
