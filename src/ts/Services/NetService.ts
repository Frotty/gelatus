import { io, Socket } from "socket.io-client"

export class NetService {
	socket: Socket;

	connect(): void {
		console.log("Connecting to server")
		this.socket = io('http://localhost:5000', {
			reconnectionDelay: 1000,
			reconnection: true,
			transports: ['websocket'],
			agent: false,
			upgrade: false,
			rejectUnauthorized: false
		});

	}
}

export const netService: NetService = new NetService();
