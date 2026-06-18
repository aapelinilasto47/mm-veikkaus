import unittest
import re

def clean_team_name(name_raw):
    return re.sub(r'\s+\d+$', '', name_raw).strip()

class TestFlashscoreScraper(unittest.TestCase):

    def test_red_card_removal(self):
        """Varmistaa, että punaisen kortin numero poistetaan nimen lopusta"""
        self.assertEqual(clean_team_name("Etelä-Afrikka 2"), "Etelä-Afrikka")
        self.assertEqual(clean_team_name("Ranska 1"), "Ranska")

    def test_normal_name_stays_same(self):
        """Varmistaa, ettei koodi koske nimiin, joissa ei ole kortteja"""
        self.assertEqual(clean_team_name("Bosnia ja Herzegovina"), "Bosnia ja Herzegovina")
        self.assertEqual(clean_team_name("Saudi-Arabia"), "Saudi-Arabia")

if __name__ == '__main__':
    unittest.main()