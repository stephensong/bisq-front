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

const request = require('request');
const tools = require('../src/resources/modules/tools.js');
const market = require('./market.js');
const convert = require('./conversion_filters/bisq.js')

var api = function(socket,port){
	this.socket = socket;
	this.endpoint = 'http://localhost:'+port+'/api/v1/';
	var self = this;
	this.socket.on('get',function(data){
		if(data.command === 'offer_make'){

			/*Invert percentages to suite offer conditions*/
				data.params.percentage_from_market_price = data.params.direction === 'BUY'?
					(data.params.percentage_from_market_price*-1)/100:
					(data.params.percentage_from_market_price*1)/100;
			/*END inversion */

			/*HACK fiat currencies are two decimal places too low for bisq-api*/
				if(data.params.price_type === 'FIXED' && data.params.fiat) data.params.fixed_price = data.params.fixed_price*100
			/* End HACK */

			delete data.params.fiat;
		}
		self.get(data).then(function(response){
			self.socket.emit(data.command,response);
		},(err)=>{
			self.socket.emit(data.command,{error:err});
		});
	})
	this.socket.on('delete',function(data){
		self.delete(data).then(function(response){
			self.socket.emit(data.command,response);
		});
	})

	this.socket.on('market',function(data){
		market.get(data.command,data.params).then(function(response){
			self.socket.emit(data.command,response);
		},(err)=>{
			self.socket.emit(data.command,{error:err});
		});
	})
}

api.prototype.get = function(data){
	var url = this.endpoint+data.command+tools.params(data.params);
	return new Promise(function(resolve,reject){
		request.get({
			url:url,
			json:true,
		},function(err,resp,body){
			if(err) reject(err.toString())
			var d = convert.get(data.command,body)
			!d?reject('Failed to get '+data.command):resolve(d);
		})
	})
}
api.prototype.delete = function(data){
	var url = this.endpoint+data.command+tools.params(data.params);
	return new Promise(function(resolve,reject){
		request.delete({
			url:url,
			json:true,
		},function(err,resp,body){
			resolve(convert.get(data.command,body));
		})
	})
}

module.exports = api;
