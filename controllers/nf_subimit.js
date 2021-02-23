const sqlCommand = require('../Database/db');
const sqlTransacCommand = require('../Database/dbTransac');
const { request } = require('express');
require('dotenv').config();
const jwt = require('jsonwebtoken');

module.exports = {

    async index(request, response) {

        const token = request.headers.authorization;
        const { company, chave_form, nf_form, chave_usina, nf_usina, qtd_usina, order, seq_reg } = request.body

        jwt.verify(token, process.env.SECRET, function (err, decoded) {
            if (err) {
                return response.status(401).json({
                    status: 401,
                    response: "Sessão expirada ou token inválido!",
                });
            }
        });
        console.log('primeiro try nf_submit: ')
        try {
            const resultERP = await sqlCommand(`select top(1) nota_fiscal, trans_nota_fiscal from fat_nf_mestre where empresa='${company}' and trans_nota_fiscal in (
                select trans_nota_fiscal from fat_nf_item where pedido = '${order}' and empresa = '${company}'
                )`);

            if (resultERP.rowsAffected != 0) {
              
                try {
                    const sql = resultERP.recordset[0];
                    console.log(`encontrou a transacao da NF venda: ${sql.trans_nota_fiscal}`)
                    console.log('Verificando se existe nota referenciada ja inserida...')
                    const verifyLote = sqlCommand(`select 1 as total from fat_nf_refer_item where trans_nota_fiscal = ${sql.trans_nota_fiscal}`)

                    if(verifyLote.data.total ===1){
                        console.log('Nao permitido')
                        return;
                    }
                    console.log(`não existe, tentará inserir...`)
                    const insertFormLote = await sqlTransacCommand(
                        `insert into fat_nf_refer_item 
                        select  a.empresa, '${sql.trans_nota_fiscal}', '1', a.trans_nota_fiscal, '1','0','NFE',a.nota_fiscal, '1', a.dat_hor_emissao,19,a.cliente,55, b.chave_acesso, 0 
                        from fat_nf_mestre a, obf_nf_eletr b 
                        where a.nota_fiscal = ${nf_form}
                        and a.trans_nota_fiscal = b.trans_nota_fiscal 
                        and a.empresa = b.empresa`);

                    if (insertFormLote.rowsAffected[0] === 1) {
                        try {
                            console.log('Inserido com sucesso a NF referenciada, buscando dados de nf usina...')
                            const insertUsina = await sqlCommand(`select * from FAT_EXP_NF_ITEM_COMPL  
                        where trans_nota_fiscal = '${sql.trans_nota_fiscal}' 
                        and seq_registro = '1' `)

                            if (insertUsina.rowsAffected != 0) {
                                console.log('dados da usina encontrados, efetuando update...')
                                const insertUsina = await sqlTransacCommand(`update FAT_EXP_NF_ITEM_COMPL 
                                set chave_nfe_export = ${chave_usina}, qtd_export_item = ${qtd_usina}
                                where trans_nota_fiscal = ${sql.trans_nota_fiscal}
                                and seq_registro = ${seq_reg} `)
                            } else {
                                console.log('dados da usina não encontrados, tentando inserir...')
                                const insertUsina = await sqlTransacCommand(`insert into fat_exp_nf_item_compl (empresa, trans_nota_fiscal, seq_item_nf, seq_registro, 
                                    processo_export, num_reg_export, dat_reg_export, 
                                    num_decl_dspc_adua, dat_decl_dspc_adua, chave_nfe_export, qtd_export_item) values
                                    ('01',${sql.trans_nota_fiscal},'1','1', null, '1',null,null,null,'${chave_usina}','${qtd_usina}')`);

                                if (insertUsina.rowsAffected[0] === 1) {
                                    return response.status(200).json({
                                        status: 200,
                                        response: 'Dados inseridos com sucesso'
                                    });
                                } else {
                                    return response.status(401).json({
                                        status: 401,
                                        response: 'Erro ao inserir dados da nota fiscal de usina'
                                    })
                                }
                            }
                        } catch (error) {
                            return response.status(401).json({
                                status: 401,
                                response: 'Erro ao inserir dados da usina'
                            });
                        }

                        return response.status(200).json({
                            status: 200,
                            response: 'Registro inserido',
                            data: insertFormLote.recordset[0]
                        });
                    }
                } catch (error) {
                    return response.status(401).json({
                        status: 401,
                        response: "Erro ao atualizar nota fiscal",
                        data: error
                    })
                }
            } else {
                return response.status(404).json({
                    status: 404,
                    response: 'Não localizei nota fiscal faturada, fature no Logix'
                })
            }
        } catch (error) {
            return response.status(404).json({
                status: 404,
                response: 'Erro na consulta, tente novamente'
            })
        }
    }
}