const repairService = require('../services/repair.service');

exports.getRepairs = async (req, res) => {
  try {
    const data = await repairService.getAllRepairs();
    res.json({
      ok: true,
      data
    });
  } catch (err) {
    res.status(500).json({
      ok: false,
      message: err.message
    });
  }
};
