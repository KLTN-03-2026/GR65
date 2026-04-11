import jwt from 'jsonwebtoken';

export const authMiddleware = (req: any, res: any, next: any) => {
    const token = req.header('Authorization')?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Không có quyền truy cập, vui lòng đăng nhập!' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
        req.user = decoded; // Dữ liệu sẽ chứa {id, role}
        next();
    } catch (err) {
        res.status(401).json({ message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.' });
    }
};
