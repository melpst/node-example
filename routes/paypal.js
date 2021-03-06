const {Router} = require('express')
const paypal = require('paypal-rest-sdk')
const {Payment} = require('../models')

const router = Router()

router.get('/', (req,res) => res.send({success: true}))

router.get('/payment', (req,res) => {
	Payment.find()
	.then((data) => res.send(data))
})

router.post('/payment/create', (req, res) =>{
	const create_payment_json = req.body
	paypal.payment.create(create_payment_json, (error, payment) => {
	    if (error) {
	        throw error;
	    } else {
	        console.log("Create Payment Response")
	        const redirect_link = payment.links.filter(link => link.rel === 'approval_url')[0].href
	        console.log(payment)
	        const trans = new Payment (payment)
	        trans.save()
	        .then((payment) => {
	        	console.log('redirecting to '+ redirect_link)
	        	res.status(payment.httpStatusCode).redirect(redirect_link)
	        })      
	    }
	})

})

router.get('/payment/execute', (req, res) => {
	const paymentId = req.query.paymentId
    console.log(paymentId)
    const payerId = req.query.PayerID
    console.log(payerId)

    const execute_payment_json = {
    	"payer_id": payerId
    }

    paypal.payment.execute(paymentId, execute_payment_json,(error, payment) => {
	    if (error) {
	        console.log(error.response)
	        throw error
	    } else {
	        console.log("Get Payment Response")
	        const redirect_link = payment.transactions[0].related_resources[0].authorization.links.filter(link => link.rel === 'self')[0].href
	        Payment.update({id: payment.id}, payment)
  			.then((payment) => {
  				console.log('redirecting to '+ redirect_link)
  				res.status(payment.httpStatusCode).redirect(redirect_link)
  			})
	        
	    }
	})
})

module.exports = router
