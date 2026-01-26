const service = require('../services/preworkOrders.service');

exports.getWorkOrder = async (req, res) => {
  try {
    const data = await service.getWorkOrderById(req.params.id);
    if (!data) {
      return res.status(404).json({ ok: false, message: 'Not found' });
    }
    res.json(data);
  } catch (err) {
    res.status(400).json({ ok: false, message: err.message });
  }
};

/* dropdown */
exports.getDropdowns = async (req, res) => {
  const [personnel] = await service.getPersonnel();
  const [departments] = await service.getDepartments();
  const [locations] = await service.getLocations();
  const [jobstatuses] = await service.getJobStatuses();

  res.json({
    personnel,
    departments,
    locations,
    jobstatuses
  });
};

exports.updateWorkOrder = async (req, res) => {
  try {
    const job_reference = await service.updateWorkOrder(
      req.params.id,
      req.body
    );

    res.json({
      ok: true,
      message: 'Work order updated',
      job_reference
    });

  } catch (err) {
    res.status(400).json({
      ok: false,
      message: err.message
    });
  }
};
