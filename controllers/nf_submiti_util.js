const sqlCommand = require('../Database/db');
const sqlTransacCommand = require('../Database/dbTransac');
const { request } = require('express');

module.exports = class NfSubmitUtil {

    constructor(company, nfSales, nfForm, qtdUsina, keyUsina, order) {
        this.company = company;
        this.nfSales = nfSales;
        this.nfForm = nfForm;
        this.qtdUsina = qtdUsina;
        this.keyUsina = keyUsina;
        this.order = order;
        this.trans_nf;
        this.nfSalesOrder;
        this.nfUsinTransNF;
    }

    async getTransNF() {
        console.log('entrei no getTransNF')


        const resultERP = await sqlCommand(`select top(1) nota_fiscal, trans_nota_fiscal from fat_nf_mestre where empresa='${this.company}' and nota_fiscal = '${this.nfSales}'`);
        if(resultERP.rowsAffected>0){this.trans_nf = resultERP.recordset[0].trans_nota_fiscal}
        else{ this.trans_nf = '0'}
    
        return {
            trans_nota_fiscal: this.trans_nf
        }
    }

    async getTransNFSales() {
        console.log('entrei no getTransNFSales')

        // const resultERP = await sqlCommand('select 1 from pri_processo_1')
        const resultERP = await sqlCommand(`select trans_nota_fiscal from
        fat_nf_item where pedido = '${this.order}'
        and empresa = '${this.company}'`);
        
        
        if(resultERP.rowsAffected[0]>0){

            const resultERPSales = await sqlCommand(`select nota_fiscal from 
            fat_nf_mestre where trans_nota_fiscal = '${resultERP.recordset[0].trans_nota_fiscal}'`)

            // console.log('Achei a nota')
            // console.log(resultERPSales.recordset[0].nota_fiscal)
            this.nfSalesOrder = resultERPSales.recordset[0].nota_fiscal
            this.trans_nf = resultERP.recordset[0].trans_nota_fiscal 
        }
        else{
            this.trans_nf = '0'
        }

        return {
            trans_nota_fiscal: this.trans_nf,
            nfSales: this.nfSalesOrder
        }
    }

    async getNFInfo(transNF){

        console.log(transNF)
        const dataInfo = await sqlCommand(`select nota_fiscal from fat_nf_mestre where trans_nota_fiscal = '${transNF}' and empresa = '${this.company}'`);

        if(dataInfo.rowsAffected>0){
            return {
                nota_fiscal : dataInfo.recordset[0].nota_fiscal
            }
        }else{
            return {
                nota_fiscal : '0'
            }
        }
    }

    async insertFlData(transNF) {

        try {
            console.log('entrei no insertFlData')

            const searchNfForm = await sqlCommand(`select 1 from fat_nf_mestre where nota_fiscal ='${this.nfForm}'
            and empresa = '${this.company}'
            and natureza_operacao = '5050'`);
            console.log(searchNfForm)
            if (searchNfForm.rowsAffected[0] > 0) {

                const checkFormInsert = await sqlCommand(`select 1 from fat_nf_refer_item where nota_fiscal_refer = '${this.nfForm}'
                and trans_nota_fiscal = '${transNF}'`)

                if (checkFormInsert.rowsAffected[0] > 0) {
                    return { status: 4, response: 'Esta NF de formação ja está referenciada' } //Não permitido
                }
                const insertFormLote = await sqlTransacCommand(
                    `insert into fat_nf_refer_item 
                select  a.empresa, '${transNF}', '1', a.trans_nota_fiscal, '1','0','NFE',a.nota_fiscal, '1', a.dat_hor_emissao,19,a.cliente,55, b.chave_acesso, 0 
                from fat_nf_mestre a, obf_nf_eletr b 
                where a.nota_fiscal = '${this.nfForm}'
                and a.trans_nota_fiscal = b.trans_nota_fiscal 
                and a.empresa = b.empresa`);

                if (insertFormLote.rowsAffected[0] === 1) {
                    return { status: 1, response: 'Nota de Formação inserida com sucesso' }// Inserido com sucesso
                }
                else {
                    return { status: 2, response: 'Ocorreu algum erro ao inserir a NF' }//Erro ao inserir
                }
            }
            else {
                return { status: 3, response: 'A NF informada não é de formação de lote (Nat 5050)' }//NF informada não é de formação de lote
            }
        } catch (err) {
            console.log(err)
        }
    }

    async insertUsinData(transNf) {
        console.log('entrei no insertUsinData')

        try {

            console.log(this.keyUsina)
            console.log(this.qtdUsina)
            console.log(transNf)
            
            const updateUsinData = await sqlTransacCommand(`update fat_exp_nf_item_compl
            set chave_nfe_export = '${this.keyUsina}', qtd_export_item = '${this.qtdUsina}' 
            where trans_nota_fiscal = '${transNf}' 
            and (chave_nfe_export is null or chave_nfe_export = '${this.keyUsina}')
            and qtd_export_item = '${this.qtdUsina}'`)

            console.log(updateUsinData)
            if (updateUsinData.rowsAffected[0]>0){
                console.log('Ok');
                return { status: 1, response: 'Dados de usina atualizada com sucesso!'}
            }else{
                console.log('falha')
                return { status: 2, response: 'Ocorreu um erro ao atualizar, verifique'}
            }
        }catch(err){
            console.log(err)
        }
    }

    async zeroNf(transNF){
        const zeroStatus = await sqlTransacCommand(`select * from obf_nf_eletr
        where empresa = '${this.company}'
        and trans_nota_fiscal= '${transNF}'`)


        console.log('Executei a limpeza do status ')
        console.log('Resultado: '+ zeroStatus)

        return zeroStatus
    }

    async getNFRefer(transNF){

        const nfReferData = await sqlCommand(`
        select empresa, trans_nf_refer, nota_fiscal_refer, chav_aces_nf_refer, qtd_item_nf_refer from fat_nf_refer_item where trans_nota_fiscal = '${transNF}' `);
        if (nfReferData.rowsAffected[0]>0){
           
            this.nfRefer = nfReferData.recordset
            return {
                nfReferData: this.nfRefer
            }
        }
        else  {
            return {
                nfReferData: '0'
            }
        }
    }

    async getNFUsin(transNF){        

        const nfUsinData = await sqlCommand(`
        select empresa, chave_nfe_export,substring(chave_nfe_export, 26,9) as nota_usina, qtd_export_item from FAT_EXP_NF_ITEM_COMPL where trans_nota_fiscal = '${transNF}'`);

        if (nfUsinData.rowsAffected[0]>0){
            this.nfUsin = nfUsinData.recordset
           
            return {
                nfUsinData:  this.nfUsin
            }
        }
        else  {
            return {
                nfUsinData: '0'
            }
        }
    }
}