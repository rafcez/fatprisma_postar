const sqlCommand = require('../Database/db');
const { request } = require('express');
require('dotenv').config();
const jwt = require('jsonwebtoken');



module.exports = {

    async index(request, response){

        const token = request.headers.authorization;

        jwt.verify(token, process.env.SECRET, function(err, decoded){
            if(err){
                return response.status(401).json({
                    status: 401,
                    response: "Sessão expirada ou token inválido!",
                });
            }
        });
    
        try{
            const resultERP = await sqlCommand('select den_reduz, cod_empresa from empresa');
            
            if(resultERP.rowsAffect !=0){
                response.status(200).json({
                    status: 200,
                    response: 'Empresas cadastradas',
                    data: resultERP.recordset
                })
            } else {
                response.stats(404).json({
                    status: 404,
                    response: 'Erro ao listar empresas'
                });
            }    
        } catch(error){
            console.log(error);
        }
    }
}