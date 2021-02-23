const sqlCommand = require('../Database/db');
const { request } = require('express');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const Nfutil = require('./nf_submiti_util')

module.exports = {

    async index(request, response) {

        const token = request.headers.authorization;
        const { company, order } = request.body

        jwt.verify(token, process.env.SECRET, function (err, decoded) {
            if (err) {
                return response.status(401).json({
                    status: 401,
                    response: "Sessão expirada ou token inválido!",
                });
            }
        });
        try {
            let receiveStatus = 0;
            let nfSalesData = [];
            let x = 1;
            await new Promise((resolve, reject) => {
                const interval = setInterval(async () => {
                    console.log('Entrei')
                    console.log(x)
                    x++;
                    const nfData = new Nfutil(company, '', '', '', '', order);
                    const trans_nota_fiscal = (await (await nfData.getTransNFSales()).trans_nota_fiscal);
                    const nfSales = (await (await nfData.getTransNFSales()).nfSales);

                    if (trans_nota_fiscal > 0 && nfSales > 0) {

                        const res = await nfData.zeroNf(trans_nota_fiscal);
                        console.log(res)
                        console.log('enviando para frontend')
                        clearInterval(interval);
                        receiveStatus = 1;
                        nfSalesData= nfSales;
                        resolve();
                        

                    } else if (x > 24) {
                        console.log('Excedeu numero de tentativas (tempo limite atingido)');
                        clearInterval(interval);
                        resolve();
                    }
                }, 10000)
            })

            if (receiveStatus == 1) {
                return response.status(200).json({
                    status: 200,
                    response: "NF Faturada",
                    data: nfSalesData
                })
            } else {

                return response.status(203).json({
                    status: 203,
                    response: 'Atingiu tempo limite, tente novamente'
                })
            }
        } catch (error) {
            console.log(error);
        }
    }
}