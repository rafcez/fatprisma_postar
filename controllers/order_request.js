const sqlCommand = require('../Database/db');
const sqlTransacCommand = require('../Database/dbTransac');
const { request } = require('express');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const { Promise } = require('mssql');

module.exports = {

    async index(request, response) {

        const token = request.headers.authorization;
        const { order, company } = request.body

        try {
            let receiveStatus = 0
            x = 1
            await new Promise((resolve, reject) => {
                const interval = setInterval(async () => {
                    x++;

                    const resultERP = await sqlCommand(`select trans_solic_fatura from fat_solic_fatura where ord_montag = '${order}'`);
                    console.log('resultERP transacao NF')
                    console.log(resultERP)
                    
                    if (resultERP.rowsAffected[0] === 1) {

                        try {
                            console.log('buscando embalagem nesse pedido')
                            const checkPackage = await sqlCommand(`select * from fat_solic_embal where ord_montag = '${order}'`);
                            console.log("checkPackage")
                            console.log(checkPackage)

                            if (checkPackage.rowsAffected[0] != 0) {
                                console.log('ja tem embalagem, abortando')
                                resolve(1)
                                clearInterval(interval)
                                return response.status(200).json({
                                    status: 200,
                                    response: 'Pedido já possui embalagem',
                                    data: checkPackage.recordset[0]
                                });
                            } else {
                                console.log('embalagem não localizada, inserindo')
                                try {
                                    const resultERP = await sqlTransacCommand(`INSERT INTO FAT_SOLIC_EMBAL 
                                SELECT trans_solic_fatura, ord_montag, lote_ord_montag, '1', '1'
                                FROM FAT_SOLIC_FATURA
                                where ord_montag = '${order}'`);
                                    console.log('Resultado: ')
                                    console.log(resultERP)
                                    if (resultERP.rowsAffected[0] != 0) {
                                        resolve(1)
                                        clearInterval(interval)
                                        return response.status(200).json({
                                            status: 200,
                                            response: 'Dados da embalagem inseridos fature a NF'
                                        });
                                    }
                                } catch (error) {
                                    console.log('Erro ao inserir dados')
                                    console.log(error)
                                    reject();
                                    clearInterval(interval);
                                    return response.status(404).json({
                                        status: 404,
                                        response: 'Erro'
                                    });
                                }
                            }
                        } catch (error) {
                            console.log('Erro ao consultar embalagem para este pedido')
                            console.log(error)
                            reject();
                            clearInterval(interval);
                            return response.status(404).json({
                                status: 404,
                                response: 'Erro'
                            });
                        }
                    }
                    else if(x > 24) {
                        console.log('Não existe solicitação... aguardando');
                        resolve(1)
                        clearInterval(interval)
                        return response.status(203).json({
                            status: 203,
                            response: 'Dados não encontrados'
                        });
                    }
                }, 10000)
            })

            receiveStatus = 1

        } catch (error) {
            return response.status(404).json({
                status: 404,
                response: 'Erro ao buscar pedido'
            });
        }
    }
}