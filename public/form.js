
var addNum = document.getElementById('add')
var form = document.getElementById('form')
var number = document.getElementById('number')
var message = document.getElementById('message')

addNum.addEventListener('click', (e) => {
    e.preventDefault()
    var container = document.querySelector('.form-container');
    var section = document.getElementById("section");
    container.appendChild(section.cloneNode(true));
})
