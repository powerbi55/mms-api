const service = require('../services/preworkOrders.service');

//ดึง work order มาแสดงทั้งหมด
exports.getWorkOrderList = async (req, res) => {
  try {
    const rows = await preworkOrdersService.getPreWorkOrders();

    res.json({
      data: rows,   // 👈 สำคัญ
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


//ดึง work order 1 ตัวมาแสดง
exports.getWorkOrder = async (req, res) => {
  try {
    const data = await service.getWorkOrderById(req.params.id);

    if (!data) {
      return res.status(404).json({
        ok: false,
        message: 'Work order not found'
      });
    }

    res.json({
      ok: true,
      data
    });

  } catch (err) {
    res.status(400).json({
      ok: false,
      message: err.message
    });
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

     console.log('REQ.USER >>>', req.user);

    const updated_by = req.user.pns_id;

    if (!updated_by) {
      return res.status(401).json({
        ok: false,
        message: 'Unauthorized: missing user info'
      });
    }

    const job_reference = await service.updateWorkOrder(
      req.params.id,
      req.body,
      updated_by
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

