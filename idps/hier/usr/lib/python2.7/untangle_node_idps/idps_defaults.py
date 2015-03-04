"""
IDPS defaults management
"""
import json

class IdpsDefaults:
    """
    Profile defaults
    """
    file_name = "/usr/share/untangle-snort-config/current/templates/defaults.js"

    def __init__(self):
        self.settings = {}

    def load(self, file_name=None):
        """
        Load settings
        """
        if file_name == "":
            file_name = self.file_name
            
        settings_file = open(self.file_name)
        self.settings = json.load(settings_file)
        settings_file.close()

    def get_profile(self, profile_id):
        """
        Return the desired profile by identifier.
        """
        for profile in self.settings["profiles"]:
            if profile_id == profile["profileId"]:
                return profile