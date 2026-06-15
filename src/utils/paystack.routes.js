exports.PAYSTACK_ROUTES = {
   initialize_transaction: '/transaction/initialize',
   verify_transaction: '/transaction/verify/:reference', 
   transactions: '/transaction',
   transaction_by_id: '/transaction/:id',
}
exports.PAYSTACK_METHOD = {
    POST: "POST",
    GET: "GET",
    PUT: "PUT",
    PATCH: "PATCH"
}