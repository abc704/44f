const path = require('path')
const express = require('express')
const wbm = require("./wbm");
// const req = require('express/lib/request');
const upload = require('express-fileupload')
const reader = require('xlsx')
var fs = require('fs');

const app = express()
app.use(upload())
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html')
})

const port = process.env.PORT || 5000
const publicDirectoryPath = path.join(__dirname, '/public')

app.use(express.urlencoded({ extended: true }))
app.use(express.static(publicDirectoryPath))

app.get('/', (req, res) => {
    res.sendFile(path.join(publicDirectoryPath, '/index.html'))
})

app.post('/files', (req, res) => {
    if (req.files) {
        console.log(req.files)
        var file = req.files.file
        var filename = file.name
        console.log(filename)
        file.mv("./" + filename, function (err) {
            if (err) {
                res.send(err)
            }
            else {
                // res.send("file uploaded")
                console.log("done beaches");
                const file = reader.readFile(filename)

                let data = []

                const sheets = file.SheetNames

                for (let i = 0; i < sheets.length; i++) {
                    const temp = reader.utils.sheet_to_json(
                        file.Sheets[file.SheetNames[i]])
                    temp.forEach((res) => {
                        data.push(res)
                    })
                }
                console.log(data);
                let phones = [];
                let message = [];
                for (let i = 0; i < data.length; i++) {
                    phones[i] = data[i].phones
                    message[i] = data[i].message
                }
                console.log(message)
                wbm.start({ session: false, showBrowser: true }).then(async () => {
                    // const phones = ['919354723868','917004346065','917004346065'];
                    // const message = ["this is 1","this is 2","this is 3"];
                    // const i=0;
                    // console.log(i++);
                    // await wbm.send(data[0].phones, data[0].message);
                    //  data.map(d=>  async(  wbm.send(d.phones, d.message)))
                    // i=0;
                    await wbm.send(phones, message);
                    await wbm.end();
                    fs.unlink(filename, function (err) {
                        if (err) throw err;
                        // if no error, file has been deleted successfully
                        console.log('File deleted!');
                    });
                }).catch(err => console.log(err));

            }
        })
    }

})

///file code 
// const file = reader.readFile('./test.xlsx')

// let data = []

// const sheets = file.SheetNames

// for(let i = 0; i < sheets.length; i++)
// {
//    const temp = reader.utils.sheet_to_json(
//         file.Sheets[file.SheetNames[i]])
//    temp.forEach((res) => {
//       data.push(res)
//    })
// }
// console.log(data);
// let phones=[];
// let message=[];
// for(let i = 0; i <data.length; i++){
//     phones[i]=data[i].phones
//     message[i]=data[i].message
// }
//   console.log(message)
// // Printing data
// // console.log(data[0].phones)
// console.log(phones)
// let r=false


// manual entry

app.post('/submit', (req, res) => {

    console.log(req.body)
    let phones = ''
    if (typeof req.body.number == 'object') {
        phones = req.body.number;
    }
    else {
        phones = [req.body.number]
    }
    console.log(phones)


    wbm.start({ session: false, showBrowser: true }).then(async () => {
        const message = req.body.message;
        await wbm.send(phones, message);
        await wbm.end();
    }).catch(err => console.log(err));
    res.redirect('/')
})
// else {
//     wbm.start({ session: false, showBrowser: false }).then(async () => {
//         // const phones = ['919354723868','917004346065','917004346065'];
//         // const message = ["this is 1","this is 2","this is 3"];
//         // const i=0;
//         // console.log(i++);
//         // await wbm.send(data[0].phones, data[0].message);
//         //  data.map(d=>  async(  wbm.send(d.phones, d.message)))
//         // i=0;
//          await wbm.send(phones, message);
//         await wbm.end();
//         // fs.unlink('test.xlsx', function (err) {
//         //     if (err) throw err;
//         //     // if no error, file has been deleted successfully
//         //     console.log('File deleted!');
//         // });
//     }).catch(err => console.log(err));

// }
app.listen(port, () => {
    console.log('Server is up on port ' + port)
})


