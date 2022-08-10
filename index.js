const express = require('express'),
    fs = require('fs'),
    url = require('url');
const bodyParser = require('body-parser');
const cors = require('cors');
const moment = require('moment');
const { body, validationResult } = require('express-validator');

const app = express()
const port = 3000


app.use('/public', express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/public'));

app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get("/test", (req, res, next) => {
    res.json(["Tony", "Lisa", "Michael", "Ginger", "Food"]);
});

const filePath = __dirname + '/public/data.txt';
console.log('filePath:', filePath)

app.post('/orders',
    body('id').exists(),
    body('title').exists(),
    body('date').exists(),
    body('type').exists(),
    body('customer').exists(),
    function (req, res) {
        const errors = validationResult(req);
        console.log(errors)
        if (!errors.isEmpty()) {
            res.status(422).json({ errors: errors.array() });
            return;
        }

        if (isNaN(req.body.id)) {
            res.status(422).json({ error: { message: "id must be a number" } });
            return;
        }

        try {
            fs.readFile(filePath, 'utf8', function (err, data) {
                if (err) {
                    console.log("READ FILE ERROR:", err)
                    throw err;
                }
                
                let json = [];
                if (data) {
                    json = JSON.parse(data)
                }

                const ids = json.map((item, idx) => parseInt(item.id))
                console.log(ids)
                if (ids.length && ids.includes(parseInt(req.body.id))) {
                    console.log("ERROR: ID ALREADY EXISTS")
                    res.status(404).json({ error: { message: `Order with id ${req.body.id} already exists` } })
                    return;
                };

                json.push(req.body)

                fs.writeFile(filePath, JSON.stringify(json), function (err) {
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

app.get('/orders/:id', (req, res) => {
    // Reading id from the URL
    const id = req.params.id;

    fs.readFile(filePath, 'utf8', function (err, data) {
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

app.get('/orders/:type/:date', (req, res) => {
    // Reading id from the URL
    const type = req.params.type;
    const date = req.params.date;

    fs.readFile(filePath, 'utf8', function (err, data) {
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