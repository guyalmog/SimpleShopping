module.exports = {
    ensureAuthenticated: function (req, res, next) {
        if (req.isAuthenticated()) {
            return next()
        }
        res.redirect('/user/')
    },
    ensureAdminAuthenticated: function (req, res, next) {
        if (req.isAuthenticated() && req.user.admin) {
            return next()
        }
        res.redirect('/404')
    },
    ensureNotLogged: function (req, res, next) {
        if(!req.isAuthenticated()) {
            return next()
        }
        res.redirect('/')
    }
}
