const shippingAddressRouter = require('express').Router();
const shared = require('../shared');
const { validateRequestData } = require('../shared/middleware/data_validator.middleware');

shippingAddressRouter.post('/', validateRequestData("ZShippingAddressSchema"), shared.Controllers.ShippingAddressCtrl.newShippingAddress).get('/', shared.Controllers.ShippingAddressCtrl.getShippingAddress).patch('/', shared.Controllers.ShippingAddressCtrl.updateShippingAddress).delete('/', shared.Controllers.ShippingAddressCtrl.deleteShippingAddress) 

exports.shippingAddressRouter = shippingAddressRouter;