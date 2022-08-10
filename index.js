/**
 * Author: Vincentius Aditya Sundjaja
 * Created at: Wed, 9 August 2022
 */

///////////////// Importing all the required dependencies /////////////////
const express = require('express'),
    fs = require('fs'),
    url = require('url');
const bodyParser = require('body-parser');
const cors = require('cors');
const moment = require('moment');
const { body, validationResult } = require('express-validator');
const app = express()

///////////////// Static constants /////////////////
const port = 3000
const dataPath = __dirname + '/public/data.txt';

///////////////// Configuring the express app /////////////////
app.use('/public', express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/public'));

app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


///////////////// DEFINING THE APIs /////////////////

// This endpoint is to test if the server is working
app.get("/ping", (req, res, next) => {
    res.json("You've pinged the server!");
});

// This endpoint is to receive POST data and store it within the service
app.post('/orders',
    body('id').exists(),
    body('title').exists(),
    body('date').exists(),
    body('type').exists(),
    body('customer').exists(),
    function (req, res) {

        // Checking if the required attributes exist
        const errors = validationResult(req);
        console.log(errors)
        if (!errors.isEmpty()) {
            res.status(422).json({ errors: errors.array() });
            return;
        }

        // checking if id is a number
        if (isNaN(req.body.id)) {
            res.status(422).json({ error: { message: "id must be a number" } });
            return;
        }

        try {
            // fetching current data
            fs.readFile(dataPath, 'utf8', function (err, data) {
                if (err) {
                    console.log("READ FILE ERROR:", err)
                    throw err;
                }
                
                let json = [];
                if (data) {
                    json = JSON.parse(data)
                }

                // getting all the current ids and checking if the new id already exists or not
                const ids = json.map((item, idx) => parseInt(item.id))
                console.log(ids)
                if (ids.length && ids.includes(parseInt(req.body.id))) {
                    console.log("ERROR: ID ALREADY EXISTS")
                    res.status(404).json({ error: { message: `Order with id ${req.body.id} already exists` } })
                    return;
                };

                json.push(req.body)

                // if all validations are successful, then continue to write the data
                fs.writeFile(dataPath, JSON.stringify(json), function (err) {
                    if (err) {
                        throw err;
                    }
                    console.log('written successfully!');

                    res.send(`Order with id ${req.body.id} is added`)
                    return;
                });
            })

        } catch (err) {
            res.status(422).json(err)
        }
    });

// This endpoint is to fetch an order based on its id
// Example: `/orders/1`
app.get('/orders/:id', (req, res) => {
    const id = req.params.id;

    fs.readFile(dataPath, 'utf8', function (err, data) {
        if (err) {
            console.log("READ FILE ERROR:", err)
            throw err;
        }
        
        let json = [];
        if (data) {
            json = JSON.parse(data)
        } else {
            res.status(404).send('Book not found');
            return;
        }

        const order = json.filter((item, idx) => item.id === id)
        
        if (order) {
            res.json(order[0])
        } else {
            res.status(404).send('Book not found');
        }
    })
});

// This endpoint is to get a list of order ids, customers, and total orders that has a 
// certain type on a certain date.
// Example: `/orders/iPhone13/20160922`
app.get('/orders/:type/:date', (req, res) => {
    // Reading id from the URL
    const type = req.params.type;
    const date = req.params.date;

    fs.readFile(dataPath, 'utf8', function (err, data) {
        if (err) {
            console.log("READ FILE ERROR:", err)
            throw err;
        }
        
        let json = [];
        if (data) {
            json = JSON.parse(data)
        } else {
            res.status(404).send('Book not found');
            return;
        }

        const result = {
            type: type,
        }
        
        let count = 0;
        const order_ids = []
        const related_customers = []

        json.forEach((item, idx) => {
            if (item.type === type && moment(item.date).format('YYYYMMDD') === date) {
                console.log('here')
                count = count + 1;
                order_ids.push(item.id)
                related_customers.push(item.customer)
            }
        })
        
        result['count'] = count
        result['orders'] = [...new Set(order_ids)]
        result['related_customers'] = [...new Set(related_customers)]
        
        if (result.count) {
            res.json(result)
        } else {
            res.status(404).send('No order found.');
        }
    })
});


app.listen(port, () => console.log(`Server running on port ${port}!`));