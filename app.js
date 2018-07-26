/* importar as configurações do servidor*/
var app = require('./config/server');

/*parametrizar a porta de escuta */
var server = app.listen(80, function(){
    console.log('Servidor online');
})


function csvJSON(csv){

    var head = ['nome', 'id', 'ns', 'sessao', 'memuse' ];

    var lines=csv.split("\n");
  
    var result = [];
  
    for(var i=0;i<lines.length;i++){
  
        var obj = {};
        var currentline=lines[i].split(",");
  
        for(var j=0;j<head.length;j++){
            obj[head[j]] = currentline[j];
        }
  
        result.push(obj);
  
    }


    var a = JSON.stringify(result); //JSON
    var b = JSON.parse(a);

    for(i = 0; i < b.length -1; i++){
        b[i].nome = b[i].nome.substring(1, b[i].nome.length - 1);
        b[i].id = b[i].id.substring(1, b[i].id.length - 1);
        b[i].ns = b[i].ns.substring(1, b[i].ns.length - 1);
        b[i].sessao = b[i].sessao.substring(1, b[i].sessao.length - 1);
        b[i].memuse = parseFloat(b[i].memuse.substring(1, b[i].memuse.length - 3));      
    };

    //a = JSON.stringify(b);
    //return result; //JavaScript object
    return b
    
  }

var shell = require('shelljs');

function procCalc(){
    var a = shell.exec('tasklist /NH /FO CSV');

    var nomej = csvJSON(a.stdout);
    nomej.pop();

    var array = [];

    nomej.forEach((element) => array.push(element.memuse));

    var processos = [];
    for(var j = 0; j < 3; j++){
        var maior = 0;
        var indice;

        for(var i = 0; i < array.length; i++){
            if(array[i] > maior){
                indice = i;
                maior = array[i];
            }
        }

        array[indice] = 0;
        processos.push(nomej[indice]);
    }
    return processos;
}


var os = require('os-utils');

var cpuUsage;
os.cpuUsage(function(v){
    cpuUsage = v;
});

var io = require('socket.io').listen(server);

app.set('io', io);

/* criar a conexão por websocket */
io.on('connection', function(socket){

    console.log('usuario conectado');
    socket.on('disconnect', function(){
        console.log('usuario desconectado');
    });

    /* dialogo */
    socket.on('msgParaServidor', function(data){


        if(data.op == 1){
            os.cpuUsage(function(v){
                cpuUsage = v;
            });

            socket.emit(
                'msgParaCliente', 
                {op: 1, cpu: cpuUsage , mem: (1 - os.freememPercentage())}
            );
            
            /*socket.broadcast.emit(
                'msgParaCliente', 
                {cpu: cpuUsage , mem: (1 - os.freememPercentage()), proc: processos}
            );*/
        }

        if(data.op == 2){
            socket.emit(
                'msgParaCliente', 
                {op: 2, sysup: os.sysUptime(), procup: os.processUptime() }
            );
        }
    
        if(data.op == 3){
            processos = procCalc();
            socket.emit(
                'msgParaCliente', 
                {op: 3, proc: processos}
            );
        }

        function sleep(milliseconds) {
            var start = new Date().getTime();
            for (var i = 0; i < 1e7; i++) {
              if ((new Date().getTime() - start) > milliseconds){
                break;
              }
            }
        }
        sleep(2000);
    });


    
});