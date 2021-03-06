"use strict"

/*
 * Copyright 2018 Michael Jonker (http://openpoint.ie)
 *
 * This file is part of bisq-front.
 *
 * bisq-front is free software: you can redistribute it and/or modify it
 * under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or (at
 * your option) any later version.
 *
 * bisq-front is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public
 * License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with bisq-front. If not, see <http://www.gnu.org/licenses/>.
 */

const fetch = require('node-fetch');
const tick = 5000;
const dev = require('./makedev.js');
dev.generate(1);
setInterval(()=>{
	dev.generate(1);
},1000*60*1)

function ticker(socket,api){
	this.socket = socket;
	this.api = api;
	this.tock = setInterval(()=>{
		this.emit();
	},tick)
	socket.on('ticker',()=>{
		this.emit();
	})

}

ticker.prototype.emit = function(){
	var data = {};
	var count = 0;
	var endpoints = ['trade/list','account/list','wallet/transactions/list','offers/list','wallet/btcBalance'];
	var error;

	endpoints.forEach((end)=>{
		this.api.submit({command:end},"get").then((result)=>{
			data[end.replace(/\//g,"_")]=result.data;
			count++;
			if(count === endpoints.length){
				if(!error) this.socket.emit('ticker',data);
				if(error) this.socket.emit('ticker',{error:'There was an error getting ticker data'});
			}
		},(err)=>{
			count++;
			error = true;
		})
	})
}

module.exports = ticker;
