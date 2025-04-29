const controllers = require('./controllers');
const mid = require('./middleware');

const router = (app) => {
  app.get('/getRolls', mid.requiresLogin, controllers.Roll.getRolls);

  app.get('/login', mid.requiresSecure, mid.requiresLogout, controllers.Account.loginPage);
  app.post('/login', mid.requiresSecure, mid.requiresLogout, controllers.Account.login);

  app.post('/signup', mid.requiresSecure, mid.requiresLogout, controllers.Account.signup);

  app.get('/logout', mid.requiresLogin, controllers.Account.logout);

  app.get('/changePassword', mid.requiresSecure, mid.requiresLogin, controllers.Account.changePasswordPage);
  app.post('/changePassword', mid.requiresSecure, mid.requiresLogin, controllers.Account.changePassword);

  app.get('/maker', mid.requiresLogin, controllers.Roll.makerPage);
  app.post('/maker', mid.requiresLogin, controllers.Roll.makeRoll);

  app.post('/delete', mid.requiresLogin, controllers.Roll.deleteRoll);

  app.post('/generateRollResults', mid.requiresLogin, controllers.Roll.generateRollResults);

  app.get('/', mid.requiresSecure, mid.requiresLogout, controllers.Account.loginPage);

  app.use((req, res, next) => {
    res.redirect('/');
  });
};

module.exports = router;
