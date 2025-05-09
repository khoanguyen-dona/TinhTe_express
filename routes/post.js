const router = require('express').Router()

router.get('', async( req , res ) =>{
    res.status(200).json({message: 'post success'})
})


module.exports = router