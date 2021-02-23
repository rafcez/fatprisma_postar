const sqlCommand = require('../Database/db');
const sqlTransacCommand = require('../Database/dbTransac');
const { request } = require('express');
require('dotenv').config();
const jwt = require('jsonwebtoken');

module.exports = {

    async index(request, response) {

        const token = request.headers.authorization;
        const { order, company } = request.body

        jwt.verify(token, process.env.SECRET, function (err, decoded) {
            if (err) {
                return response.status(401).json({
                    status: 401,
                    response: "Sessão expirada ou token inválido!",
                });
            }
        });

        try {
            const resultERP = await sqlCommand(`select cod_nat_oper, num_pedido from pedidos where num_pedido = '${order}' and cod_nat_oper = '0' and cod_empresa = '${company}'`);

            if (resultERP.rowsAffected != 0) {
                try {
                    const insertOrderOp = await sqlTransacCommand(`update pedidos set cod_nat_oper = '5010' where num_pedido = '${order}' and cod_empresa ='${company}'`);
                    console.log(insertOrderOp.rowsAffected[0]);
                    if (insertOrderOp.rowsAffected[0] === 1) {
                        console.log('Pedido atualizado')
                        return response.status(200).json({
                            status: 200,
                            response: 'Pedido atualizado',
                            data: resultERP.recordset[0]
                        });
                    }
                } catch (error) {
                    return response.status(401).json({
                        status: 401,
                        response: "Erro ao atualizar pedido"
                    })
                }
            } else {

                const orderStats = await sqlCommand(`select cod_nat_oper, num_pedido from pedidos where num_pedido = '${order}' and cod_empresa= '${company}' and cod_nat_oper <> '0'`)

                if (orderStats.rowsAffected != 0) {
                    return response.status(403).json({
                        status: 403,
                        response: 'Pedido já possui natureza passe para proxima etapa'
                    })
                }
                return response.status(404).json({
                    status: 404,
                    response: 'Pedido não encontrado'
                })
            }
        } catch (error) {
            return response.status(403).json({
                status: 403,
                response: 'Pedido já possui natureza passe para proxima etapa'
            })
        }
    }
}