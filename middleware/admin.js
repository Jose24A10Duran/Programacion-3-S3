module.exports = function (req, res, next) {
    if (req.user.level !== 'admin') {
        return res.status(403).json({ msg: 'Acceso denegado: Se requieren permisos de administrador' });
    }
    next();
};
