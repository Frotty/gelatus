import { io, Socket } from "socket.io-client"

export class NetService {
	socket: Socket;

	connect(): void {
		console.log("Connecting to server")
		this.socket = io();

	}
}

export const netService: NetService = new NetService();
