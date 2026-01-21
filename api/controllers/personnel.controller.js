const personnelService = require('../services/personnel.service');

exports.updatePersonnel = async (req, res) => {
  try {
    const { pns_id } = req.params;
    const { pns_name, dep_id } = req.body;

    if (!pns_name && !dep_id) {
      return res.status(400).json({
        ok: false,
        message: 'No data to update'
      });
    }

    await personnelService.update(pns_id, {
      pns_name,
      dep_id
    });

    res.json({
      ok: true,
      message: 'Personnel updated'
    });

  } catch (err) {
    res.status(400).json({
      ok: false,
      message: err.message
    });
  }
};
