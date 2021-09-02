const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const cors = require('cors');
const bodyParser = require('body-parser');

const port = 4500 || process.env.PORT;

const app = express();
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json())
app.use(cors());

const server = http.createServer(app);
const io = require('socket.io')(server);

require('dotenv').config();

const password = process.env.password;
const database = 'edyodaDB';
const connectingString = `mongodb+srv://dbchandana:${password}@cluster1.dkwws.mongodb.net/${database}?retryWrites=true&w=majority`;
const options = {
    useUnifiedTopology: true,
    useNewUrlParser: true
}

mongoose.connect(connectingString,options)
.then(() => console.log('Database connected!!'))
.catch(err => console.log(err));

const schema = new mongoose.Schema({},{strict: false});
const SensorsData = mongoose.model('real-time-datas',schema);

setInterval(addSensorData,10000)

async function addSensorData(){
    const data = new SensorsData({
        temperature: (Math.floor(Math.random() * 40) + 10),
        batteryLevel: (Math.floor(Math.random() * 100) + 1),
        timeStamp: new Date()
    })
    const addData = await data.save();
    console.log(addData)
}

app.get('/', (req,res) => {
    res.send('chandana!!')
})

app.get('/delete', async (req,res) =>{
    const data = await SensorsData.deleteMany();
    res.send(data)
})

app.post('/getData',async(req, res)=>{
    const startDate = req.body.startDate;
    const endDate = req.body.endDate;
    const a = new Date(startDate);
    const b = new Date(endDate);
    console.log(a, b)
    const data = await SensorsData.find({ timeStamp: { $gt: new Date(startDate), $lt: new Date(endDate) } } );
    res.send(data)
})

io.on('connection',(socket) => {
    console.log('new connection');
    socket.on('join', async (data) => {
        const getData = await SensorsData.find().limit(20).sort({timeStamp: -1});
        socket.emit('start',getData)
        setInterval(async ()=>{
            const getData = await SensorsData.find().limit(20).sort({timeStamp: -1});
            socket.emit('message',getData)
        },10000)
    })
})

server.listen(port,() => console.log(`Server Started at http://localhost:${port}`))
