
const getUser = username => '<strong>' + username + '</strong>: ';
const getStockMsg = (code, price) => `${code.toUpperCase()} quote is $${price} per share`

module.exports = {
    getUser,
    getStockMsg
};
