/*
    Uninet
    Copyright (C) 2019  Zaoqi <zaomir@outlook.com>
    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published
    by the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.
    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.
    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/
const UninetAddress = require('uninet-address')
const assert = require('assert').strict
const websocket = require('ws')

const enum PacketType {
    Servers,
    GetServers,
    RoutingTable,
    GetRoutingTable,
    ProxyMe,
    Packet,
}

type Address = string
type Key = string

type LowAddressStr = string
type LowAddress = ["ws", string] | ["wss", string]

function LowAddressStr2LowAddress(x: LowAddressStr): LowAddress {
    if (x.startsWith("ws://")) {
        return ["ws", x.slice(5)]
    }
    assert(x.startsWith("wss://"))
    return ["wss", x.slice(6)]
}

class Server {
    private readonly _port: number
    private readonly _self_url: string
    private readonly _router: { [k: string]: Set<LowAddressStr> }
    private readonly _all_servers: Set<LowAddressStr>
    private readonly _console_log: (x: string) => void
    private readonly _console_error: (x: string) => void
    constructor(config: {
        port: number,
        self_websocket_url: string,
        console_log?: (x: string) => void,
        console_error?: (x: string) => void,
    }) {

        this._console_log = config.console_log == null ? ((x) => console.log(x)) : config.console_log
        this._console_error = config.console_error == null ? ((x) => console.error(x)) : config.console_error
        this._port = config.port
        this._self_url = config.self_websocket_url
        this._router = {}
        this._all_servers = new Set()

        this._all_servers.add(this._self_url)

        this._console_log(`Uninet Server starting... port="${this._port}" url="${this._self_url}"`)

        new websocket.Server({ port: this._port }).on('connection', ws => {
            ws.on('message', raw_msg => (async function() {
                const msg: any = JSON.parse(raw_msg)
                assert(Array.isArray(msg) && msg.length > 0)
                const type: PacketType = msg[0]
                if (type === PacketType.Servers) {
                    assert(msg.length === 2 && Array.isArray(msg[1]))
                    for (const x of msg[1]) {
                        assert(Array.isArray(x) && x.length === 2 && (x[0] === 'ws' || x[0] === 'wss') && typeof x[1] === 'string')
                        const addr: LowAddressStr = `${x[0]}://${x[1]}`
                        this._console_log(`Servers: add ${addr}`)
                        this._all_servers.add(addr)
                    }
                } else if (type === PacketType.GetServers) {
                    assert(msg.length === 1)
                    const result: Array<LowAddress> = []
                    this._all_servers.forEach(x => result.push(LowAddressStr2LowAddress(x)))
                    ws.send(JSON.stringify([PacketType.Servers, result]))
                } else if (type === PacketType.RoutingTable) {
                    throw 'WIP'
                } else if (type === PacketType.GetRoutingTable) {
                    throw 'WIP'
                } else if (type === PacketType.ProxyMe) {
                    throw 'WIP'
                } else if (type === PacketType.Packet) {
                    throw 'WIP'
                } else {
                    assert(false)
                }
            })().catch(this._console_error))
        })
    }


    private _router_get(addr: string): Set<LowAddressStr> | undefined {
        return this._router[addr]
    }
    private _router_add(addr: string, low_addr: LowAddressStr): void {
        if (this._router[addr] === void 0) {
            this._router[addr] = new Set()
        }
        this._router[addr].add(low_addr)
    }

    public async send_packet(address: Address, sender: Address, sender_key: Key, message: Uint8Array) {
        throw 'WIP'
    }
}

export { Server }
