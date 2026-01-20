const syncService = require('../services/sync.service');

exports.syncNow = async (req, res) => {
  try {
    const inserted = await syncService.syncFromSheet();
    res.json({
      ok: true,
      inserted
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      ok: false,
      message: err.message
    });
  }
};
