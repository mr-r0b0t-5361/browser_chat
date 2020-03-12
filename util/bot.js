const fetch = require("node-fetch");

const { PRIMARY_URL_STOOQ } = require('../constants/bot')

const getStockPrice = stockCode =>
  new Promise((resolve, reject) => {
    fetch(PRIMARY_URL_STOOQ + `&s=${stockCode}`)
      .then(res => res.json())
      .then(data => resolve(data.symbols[0].close))
      .catch(err => reject(err));
  });

module.exports = {
  getStockPrice
};
