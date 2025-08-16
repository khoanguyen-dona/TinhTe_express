const router = require('express').Router()
const  redis = require('../config/redis');
const { format, addDays, isThisMonth, getDaysInMonth, parseISO } = require('date-fns');

// post a visit to redis
router.post('/', async(req, res) => {
    try {
        const day = req.query.day
        const month = req.query.month
        const year = req.query.year
        const pipeline = redis.multi()

        pipeline.get(`visit-by-day:${year}-${month}-${day}`)
        pipeline.get(`visit-by-month:${year}-${month}`)
        const pipelineResult = await pipeline.exec()

        if(pipelineResult[0] === null && pipelineResult[1] === null ){
            pipeline.set(`visit-by-day:${year}-${month}-${day}`, 1)
            pipeline.set(`visit-by-month:${year}-${month}`, 1)
            await pipeline.exec()
        } else if(pipelineResult[0] === null && pipelineResult[1] !== null ){
            console.log('it run')
            pipeline.set(`visit-by-day:${year}-${month}-${day}`, 1)
            pipeline.incr(`visit-by-month:${year}-${month}`)
            await pipeline.exec()
        } else if(pipelineResult[0] !== null && pipelineResult[1] === null ){
            pipeline.incr(`visit-by-day:${year}-${month}-${day}`)
            pipeline.set(`visit-by-month:${year}-${month}`, 1)
            await pipeline.exec()
        } else {
            pipeline.incr(`visit-by-day:${year}-${month}-${day}`)
            pipeline.incr(`visit-by-month:${year}-${month}`)
            await pipeline.exec()
        }

        res.status(200).json({message:'success'})
    } catch(err){
        console.log('post /visit api failed', err)
    }
})

// get visit from redis
router.get('/', async(req, res) => {
    try {
        let dataChart = []
  
        const byYear = req.query.byYear
        const year = req.query.year
        const month = req.query.month
        const day = req.query.day

        console.log('byYear', byYear)
        const pipeline = redis.multi()

        // const result = await redis.get(`visit-by-day:2025-07-15`)

        if(byYear === 'false'){
            const daysInMonth = getDaysInMonth(`${year}-${month}-${day}`);
    
            for ( i=1; i<=daysInMonth; i++ ){
                pipeline.get(`visit-by-day:${year}-${month}-${i}`)          
            }
            const result = await pipeline.exec()
    
            let count = 1
            for ( r of result){
                dataChart.push({date:`${year}-${month}-${count}`, views: Number(r)})
                count = count + 1
            }
            res.status(200).json({message:'success', dataChart: dataChart})
           
        }
        else{
            for( i=1; i<=12; i++ ){
                if(i<10){
                    pipeline.get(`visit-by-month:${year}-0${i}`)
                } else {
                    pipeline.get(`visit-by-month:${year}-${i}`)
                }             
            }
            const result = await pipeline.exec()
            let count = 1
            for ( r of result ){
                if(count < 10 ){
                    dataChart.push({date:`${year}-0${count}`, views: Number(r)})
                } else {
                    dataChart.push({date:`${year}-${count}`, views: Number(r)})
                }
                count +=1
            }
            res.status(200).json({message:'success', dataChart: dataChart})
        }      
    } catch(err){
        console.log('get /visit api failed', err)
    }
})












module.exports = router