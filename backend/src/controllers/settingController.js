const Setting = require("../models/Setting");

const getSettings = async (req, res) => {
  try {
    const list = await Setting.find();
    const settings = {};
    list.forEach(s => {
      settings[s.key] = s.value;
    });
    // Ensure default settings exist if not set
    if (settings.manualItemMode === undefined) {
      settings.manualItemMode = "A"; // default: Option A: do not affect stock
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const saveSettings = async (req, res) => {
  try {
    const updates = req.body || {};
    const results = {};

    for (const key of Object.keys(updates)) {
      const val = updates[key];
      const doc = await Setting.findOneAndUpdate(
        { key },
        { value: val },
        { upsert: true, new: true }
      );
      results[key] = doc.value;
    }

    if (req.io) {
      req.io.emit("settings-updated", results);
    }

    res.json(results);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getSettings,
  saveSettings
};
