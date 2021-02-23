const sqlCommand = require('../Database/db');
require('dotenv').config();
const jwt = require('jsonwebtoken');

module.exports = {

  async create(request, response){
    const { username, password } = request.body;

    if(username==='rafael.cezario'){

      const token = jwt.sign({ 
          username: username
      }, process.env.SECRET, {
          expiresIn: 43200 // expires in 12h
      });

      return response.status(200).json({
        status: 200,
        response: "Login realizado com Sucesso!",
        username: username,
        token: token
      })

    }else{
      return response.status(401).json({
        status: 401,
        response: "Usuário não encontrado.",
      })
    }

  },
  index(request, response){
    const token = request.headers.authorization;

    jwt.verify(token, process.env.SECRET, function(err, decoded) {
      if(err){
        return response.status(401).json({
          status: 401,
          response: "Sessão expirada ou token inválido!",
        })
      }
      return response.status(200).json({
        status: 200,
        response: "Token válido.",
        valid: true,
        data: decoded,
      })
    });
     
  }

}