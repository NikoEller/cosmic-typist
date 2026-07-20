"""Lokaler, sicherheitsbewusster Server für Cosmic Typist.

Der Server bindet ausschließlich an 127.0.0.1. Highscores werden nur lokal
in data/highscores.json gespeichert; das Spiel überträgt keine Daten ins Internet.
"""

from __future__ import annotations

from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import RLock
from urllib.parse import urlparse
import json
import mimetypes
import os
import tempfile


ROOT = Path(__file__).parent.resolve()
DATA_DIRECTORY = ROOT / "data"
HIGHSCORE_FILE = DATA_DIRECTORY / "highscores.json"
MAX_REQUEST_BYTES = 4_096
MAX_HIGHSCORES = 10
VALID_MODES = {"practice", "challenge"}
PUBLIC_FILES = {
    "/": "index.html",
    "/index.html": "index.html",
    "/style.css": "style.css",
    "/game.js": "game.js",
    "/words.js": "words.js",
}


class HighscoreStore:
    """Verwaltet die lokale Bestenliste mit einer atomaren Schreiboperation."""

    def __init__(self, file_path: Path) -> None:
        self.file_path = file_path
        self._lock = RLock()

    def load(self) -> list[dict[str, int | str]]:
        """Liest valide Einträge; eine defekte Datei führt nie zum Serverfehler."""
        with self._lock:
            try:
                raw_scores = json.loads(self.file_path.read_text(encoding="utf-8"))
            except (FileNotFoundError, json.JSONDecodeError, OSError):
                return []

            if not isinstance(raw_scores, list):
                return []

            valid_scores = [
                entry for entry in raw_scores if self._is_valid_entry(entry)
            ]
            return self._sorted_and_limited(valid_scores)

    def add(self, entry: dict[str, int | str]) -> list[dict[str, int | str]]:
        """Fügt einen geprüften Eintrag hinzu und gibt die aktuelle Rangliste zurück."""
        if not self._is_valid_entry(entry):
            raise ValueError("Ungültiger Highscore.")

        with self._lock:
            scores = self.load()
            scores.append(entry)
            scores = self._sorted_and_limited(scores)
            self._write_atomically(scores)
            return scores

    @staticmethod
    def _is_valid_entry(entry: object) -> bool:
        if not isinstance(entry, dict):
            return False

        score = entry.get("score")
        wpm = entry.get("wpm")
        mode = entry.get("mode")
        return (
            isinstance(score, int) and not isinstance(score, bool) and 0 <= score <= 10_000_000
            and isinstance(wpm, int) and not isinstance(wpm, bool) and 0 <= wpm <= 1_000
            and mode in VALID_MODES
        )

    @staticmethod
    def _sorted_and_limited(
        scores: list[dict[str, int | str]]
    ) -> list[dict[str, int | str]]:
        return sorted(scores, key=lambda entry: int(entry["score"]), reverse=True)[:MAX_HIGHSCORES]

    def _write_atomically(self, scores: list[dict[str, int | str]]) -> None:
        """Schreibt zuerst eine temporäre Datei und ersetzt danach die alte Datei."""
        self.file_path.parent.mkdir(parents=True, exist_ok=True)
        file_descriptor, temporary_name = tempfile.mkstemp(
            dir=self.file_path.parent, prefix=".highscores-", suffix=".tmp"
        )

        try:
            with os.fdopen(file_descriptor, "w", encoding="utf-8") as temporary_file:
                json.dump(scores, temporary_file, ensure_ascii=False, indent=2)
                temporary_file.write("\n")
                temporary_file.flush()
                os.fsync(temporary_file.fileno())
            os.replace(temporary_name, self.file_path)
        except OSError:
            try:
                os.unlink(temporary_name)
            except FileNotFoundError:
                pass
            raise


HIGHSCORES = HighscoreStore(HIGHSCORE_FILE)


class CosmicTypistHandler(SimpleHTTPRequestHandler):
    """Stellt statische Dateien und die kleine, lokale Highscore-API bereit."""

    server_version = "CosmicTypist/1.0"

    def end_headers(self) -> None:
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "no-referrer")
        self.send_header(
            "Content-Security-Policy",
            "default-src 'self'; style-src 'self'; script-src 'self'; "
            "img-src 'self' data:; connect-src 'self'; base-uri 'none'; "
            "frame-ancestors 'none'",
        )
        super().end_headers()

    def do_GET(self) -> None:
        path = urlparse(self.path).path
        if path == "/api/highscores":
            self._send_json(HIGHSCORES.load())
            return
        self._send_static_file(path)

    def do_POST(self) -> None:
        if urlparse(self.path).path != "/api/highscores":
            self.send_error(HTTPStatus.NOT_FOUND)
            return

        entry = self._read_highscore_request()
        if entry is None:
            return

        try:
            scores = HIGHSCORES.add(entry)
        except OSError:
            self._send_json(
                {"error": "Die Bestenliste konnte nicht gespeichert werden."},
                HTTPStatus.INTERNAL_SERVER_ERROR,
            )
            return

        self._send_json(scores, HTTPStatus.CREATED)

    def _read_highscore_request(self) -> dict[str, int | str] | None:
        """Prüft Größe, JSON-Format und Datentypen einer API-Anfrage."""
        try:
            content_length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            content_length = 0

        if not 0 < content_length <= MAX_REQUEST_BYTES:
            self._send_json({"error": "Ungültige Anfragegröße."}, HTTPStatus.BAD_REQUEST)
            return None

        if self.headers.get_content_type() != "application/json":
            self._send_json({"error": "JSON wird erwartet."}, HTTPStatus.UNSUPPORTED_MEDIA_TYPE)
            return None

        try:
            payload = json.loads(self.rfile.read(content_length))
        except (UnicodeDecodeError, json.JSONDecodeError):
            self._send_json({"error": "Ungültiges JSON."}, HTTPStatus.BAD_REQUEST)
            return None

        if not HighscoreStore._is_valid_entry(payload):
            self._send_json({"error": "Ungültiger Highscore."}, HTTPStatus.BAD_REQUEST)
            return None
        return payload

    def _send_json(self, payload: object, status: HTTPStatus = HTTPStatus.OK) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _send_static_file(self, request_path: str) -> None:
        """Liefert ausschließlich die für das Spiel benötigten öffentlichen Dateien."""
        filename = PUBLIC_FILES.get(request_path)
        if filename is None:
            self.send_error(HTTPStatus.NOT_FOUND)
            return

        try:
            body = (ROOT / filename).read_bytes()
        except OSError:
            self.send_error(HTTPStatus.NOT_FOUND)
            return

        content_type = mimetypes.guess_type(filename)[0] or "application/octet-stream"
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", content_type + "; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


class LocalServer(ThreadingHTTPServer):
    """Erlaubt einen sauberen Neustart während der lokalen Entwicklung."""

    allow_reuse_address = True


def run_server(port: int = 8000) -> None:
    os.chdir(ROOT)
    server = LocalServer(("127.0.0.1", port), CosmicTypistHandler)
    print(f"Cosmic Typist läuft unter http://127.0.0.1:{port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServer beendet.")
    finally:
        server.server_close()


if __name__ == "__main__":
    run_server()
