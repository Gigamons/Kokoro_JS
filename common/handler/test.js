const net = require('net');
const BinaryEventHandler = require('./BinaryEventHandler');

const socket = net.createConnection({ host: '127.0.0.1', port: 7585});
socket.on('connect', () => {
    socket.write(
        BinaryEventHandler.WritePacket({
            PacketID: 0,
            PacketData: {
                'Hallo': 'Welt'
            }
        })
    );
    socket.end();
    process.exit(0);
});