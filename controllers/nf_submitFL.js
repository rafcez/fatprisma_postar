const { request } = require('express');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const NfDataUtil = require('./nf_submiti_util');

module.exports = {

    async invoiceFL(request, response) {
   
        const token = request.headers.authorization;
        jwt.verify(token, process.env.SECRET, function(err, decoded){
            if(err){
                return response.status(401).json({
                    status: 401,
                    response: "Sessão expirada ou token inválido!",
                });
            }
        });      

        const { company, nfSales, nfForm } = request.body;
        console.log('submitFL para fol')
        console.log(company, nfSales, nfForm)
        const data = new NfDataUtil(company, nfSales, nfForm, '', '');
        const trans_nota_fiscal = (await (await data.getTransNF()).trans_nota_fiscal);
        const insertForm = await data.insertFlData(trans_nota_fiscal);

        if(insertForm.status == 4 || insertForm.status == 3 || insertForm.status == 2){
            return response.status(203).json({
                status: 203,
                response: insertForm.response
            });
        }
        else{
            return response.status(200).json({
                status: 200,
                response: insertForm.response
            })
        }
    },

    async invoiceUsin(request, response){

        const token = request.headers.authorization;
        jwt.verify(token, process.env.SECRET, function(err, decoded){
            if(err){
                return response.status(401).json({
                    status: 401,
                    response: "Sessão expirada ou token inválido!",
                });
            }
        });      

        const { company, nfSales, qtdUsina, keyUsina } = request.body;
        console.log("submitFL para usina")
        console.log(company, nfSales, qtdUsina, keyUsina)

        const data = new NfDataUtil(company, nfSales, '', qtdUsina, keyUsina);
        const trans_nota_fiscal = (await (await data.getTransNF()).trans_nota_fiscal);
        const existUsina = await (await data.getNFUsin(trans_nota_fiscal)).nfUsinData
        console.log('Verificando se existe usina ja refernciada')
        console.log(existUsina);

        if(existUsina !== 0){
            console.log('Encontrou nf usina irá efetuar o update');
            const updateUsinData = await data.insertUsinData(trans_nota_fiscal);

            if(updateUsinData.status == 1){
                return response.status(200).json({
                    status: 200,
                    response: updateUsinData.response
                })
            }else{
                return response.status(203).json({
                    status: 203,
                    response: updateUsinData.response
                })
            }
        }else 
        {
            console.log('Ocorreu um erro ao buscar a NF de usina ja referenciada');
        }
    },

    async searchFl(request, response){

        const { nfSales, company} = request.body;
        const data = new NfDataUtil(company, nfSales);
        const trans_nf = await (await data.getTransNF()).trans_nota_fiscal;
        const NfRefers = await data.getNFRefer(trans_nf);

        if(nfSales.nfReferData!=='0'){
            return response.status(200).json({
                status: 200,
                response: "Dados localizados",
                data: NfRefers.nfReferData
            })
        }
    },
    async searchUs(request, response){

        const { nfSales, company} = request.body;
        const data = new NfDataUtil(company, nfSales);
        const trans_nf = await (await data.getTransNF()).trans_nota_fiscal;
        const nfUsin = await data.getNFUsin(trans_nf);

        console.log(nfUsin);

        if(nfUsin.nfReferData!=='0'){
            return response.status(200).json({
                status: 200,
                response: "Dados localizados",
                data: nfUsin.nfUsinData
            })
        }
    }
}