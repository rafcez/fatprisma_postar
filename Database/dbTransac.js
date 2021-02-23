const mssql = require('mssql');

module.exports = async function (SqlComand) {

  try {

    const connection = await mssql.connect('mssql://prisma_usuario1:Pr1sm@0191@187.94.63.17:14034/SQLINST1/PRISMA_logix_prod');
    const transaction = new mssql.Transaction(connection);
    await transaction.begin();
    const request = new mssql.Request(transaction)
    const result = await request.query(SqlComand)
  
    if (result.rowsAffected[0] === 1) {

      await transaction.commit();
      await connection.close();
      console.log("Transaction committed.")
      return result;
    }
    else {
      await transaction.rollback();
      await connection.close();
      console.log('Rollback!');
      return result;
    }
  } catch (err) {
    console.log(err);
  }
}


