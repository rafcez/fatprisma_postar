const express = require('express');
const path = require('path');
const { json } = require('body-parser');
const routes = express.Router();

const companies = require('./controllers/companies');
const orders = require('./controllers/orders');
const order_request = require('./controllers/order_request');
const login = require('./controllers/login');
const nf_subimit = require('./controllers/nf_subimit');
const nf_submitFL = require('./controllers/nf_submitFL');
const checkSalesOrder = require('./controllers/checkSalesOrder');


// routes.use(express.static(path.join('./', 'build')));


// routes.get('*', (request, response, next)=>{

//     response.sendFile(path.join('/home/rafael/Documents/Desenvolvimento/teste/Faturamento_XML/backend/build/index.html'));
//     next()
//  })

//login
routes.post('/api/v1/login', login.create);
//companies
routes.get('/api/v1/companies', companies.index);
//orders
routes.post('/api/v1/orders', orders.index);
routes.post('/api/v1/order_request', order_request.index);
//NF
routes.post('/api/v1/nf_submit', nf_subimit.index);
routes.post('/api/v1/nf_submitFL', nf_submitFL.invoiceFL);
routes.post('/api/v1/nf_submitUsin', nf_submitFL.invoiceUsin);
routes.post('/api/v1/checkSalesOrder', checkSalesOrder.index);
routes.post('/api/v1/nf_submitSearchFL', nf_submitFL.searchFl);
routes.post('/api/v1/nf_submitSearchUs', nf_submitFL.searchUs);

module.exports = routes
