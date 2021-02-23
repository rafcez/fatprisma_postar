const mssql = require('mssql');

module.exports = async function command(SqlComand) {
  try {

    const connection = await mssql.connect('mssql://prisma_usuario1:Pr1sm@0191@187.94.63.17:14034/SQLINST1/PRISMA_logix_prod');
    const result = await connection.query(SqlComand);

    await connection.close();

    return await result;    

  } catch (err) {
    console.log(err);
  }
}


    
