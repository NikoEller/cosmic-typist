"""Tests für die lokale Highscore-Speicherung."""

from pathlib import Path
from tempfile import TemporaryDirectory
import json
import unittest

from app import HighscoreStore


class HighscoreStoreTests(unittest.TestCase):
    def setUp(self):
        self.temporary_directory = TemporaryDirectory()
        self.file_path = Path(self.temporary_directory.name) / "scores.json"
        self.store = HighscoreStore(self.file_path)

    def tearDown(self):
        self.temporary_directory.cleanup()

    def test_add_saves_and_sorts_scores(self):
        self.store.add({"score": 200, "wpm": 35, "mode": "practice"})
        scores = self.store.add({"score": 500, "wpm": 48, "mode": "challenge"})
        self.assertEqual([entry["score"] for entry in scores], [500, 200])
        self.assertEqual(json.loads(self.file_path.read_text(encoding="utf-8")), scores)

    def test_invalid_entries_are_rejected(self):
        with self.assertRaises(ValueError):
            self.store.add({"score": "500", "wpm": 40, "mode": "practice"})
        with self.assertRaises(ValueError):
            self.store.add({"score": 500, "wpm": 40, "mode": "unknown"})

    def test_corrupted_file_returns_empty_list(self):
        self.file_path.write_text("{not valid json", encoding="utf-8")
        self.assertEqual(self.store.load(), [])

    def test_only_best_ten_scores_are_kept(self):
        for score in range(12):
            self.store.add({"score": score, "wpm": 20, "mode": "practice"})
        scores = self.store.load()
        self.assertEqual(len(scores), 10)
        self.assertEqual(scores[0]["score"], 11)
        self.assertEqual(scores[-1]["score"], 2)
