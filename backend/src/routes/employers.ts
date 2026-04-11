import express from 'express';
import { sql } from '../config/db';

const router = express.Router();

router.get('/:id', async (req: any, res: any) => {
  try {
    const request = new sql.Request();
    request.input('id', sql.UniqueIdentifier, req.params.id);
    const result = await request.query('SELECT * FROM Employers WHERE UserId = @id');
    
    if (result.recordset.length === 0) return res.status(404).json({ message: 'Hồ sơ Công ty không tồn tại' });
    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi Database truy vấn nhà tuyển dụng' });
  }
});

export default router;
